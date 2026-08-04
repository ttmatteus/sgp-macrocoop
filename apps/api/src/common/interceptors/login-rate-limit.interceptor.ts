import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, from, catchError, switchMap, tap, throwError } from 'rxjs';
import { RedisService } from '../../core/redis/redis.service';

// card do trello: 5 tentativas, janela fixa de 15min, chave por ip+login
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 900;

// 429 Too Many Requests — essa versão do NestJS não tem a exception pronta
const tooManyRequests = () => new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);

/**
 * Trava força bruta no POST /login.
 *
 * Fluxo:
 *  1. Antes do handler: se já passou de MAX_ATTEMPTS, joga 429 direto (não bate no banco).
 *  2. Roda o handler.
 *  3. Sucesso → DEL a chave (zera a contagem).
 *  4. UnauthorizedException → INCR a chave; se foi a 1ª falha, seta EXPIRE (janela fixa).
 *     Se a contagem chegou em MAX_ATTEMPTS, troca o 401 por 429.
 *
 * Erros de Redis NUNCA escapam pro pipe RxJS: são engolidos nos helpers,
 * então o login continua funcionando mesmo com o Upstash fora do ar.
 */
@Injectable()
export class LoginRateLimitInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoginRateLimitInterceptor.name);

  constructor(private readonly redis: RedisService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const ip =
      req.ip ??
      String(req.headers['x-forwarded-for'] ?? '')
        .split(',')[0]
        ?.trim();
    const login: string = req.body?.usuario ?? 'unknown';

    if (!ip) {
      this.logger.warn('IP não encontrado no request, pulando rate limit');
      return next.handle();
    }

    const key = `login:attempts:${ip}:${login}`;

    return from(this.assertNotBlocked(key)).pipe(
      switchMap(() =>
        next.handle().pipe(
          tap(() => void this.reset(key)),
          catchError((err) => this.onFailure(key, err)),
        ),
      ),
    );
  }

  // joga 429 se já estourou; engole erro de Redis (deixa passar)
  private async assertNotBlocked(key: string): Promise<void> {
    try {
      const count = Number(await this.redis.get(key)) || 0;
      if (count >= MAX_ATTEMPTS) {
        throw tooManyRequests();
      }
    } catch (err) {
      if (err instanceof HttpException && err.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        throw err;
      }
      this.logger.error(`Redis GET falhou pra chave ${key}`, err);
    }
  }

  // INCR na falha; EXPIRE só na 1ª (janela fixa, não renova). Retorna a nova contagem.
  private async recordFailure(key: string): Promise<number> {
    try {
      const n = await this.redis.incr(key);
      if (n === 1) {
        await this.redis.expire(key, WINDOW_SECONDS);
      }
      return n;
    } catch (err) {
      this.logger.error(`Redis INCR falhou pra chave ${key}`, err);
      return 0;
    }
  }

  private async reset(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.error(`Redis DEL falhou pra chave ${key}`, err);
    }
  }

  private onFailure(key: string, err: unknown): Observable<never> {
    if (!(err instanceof UnauthorizedException)) {
      return throwError(() => err);
    }
    return from(this.recordFailure(key)).pipe(
      switchMap((n) =>
        n >= MAX_ATTEMPTS
          ? throwError(() => tooManyRequests())
          : throwError(() => err),
      ),
    );
  }
}
