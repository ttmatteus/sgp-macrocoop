import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { RedisService } from '../redis/redis.service';
import { CurrentUserPayload } from './current-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.['session'];

    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: CurrentUserPayload;
    try {
      payload = await this.jwtService.verifyAsync<CurrentUserPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }

    // aqui só lê a denylist, quem escreve é o alterar-senha/recuperar-senha (qdo existirem)
    const revogado = await this.redisService.get(`denylist:jti:${payload.jti}`);
    if (revogado) {
      throw new UnauthorizedException();
    }

    request.user = payload;
    return true;
  }
}
