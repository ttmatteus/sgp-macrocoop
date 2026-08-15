import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RedisService } from '../../../core/redis/redis.service';
import {
  activeSessionsKey,
  deniedSessionKey,
  sessionDetailKey,
  SESSION_TTL_SECONDS,
} from '../../../core/auth/session.constants';
import { SessaoDto } from './dto/sessoes.dto';

interface DetalheSessao {
  ip: string;
  userAgent: string;
  criadoEm: string;
}

@Injectable()
export class SessoesService {
  constructor(private readonly redis: RedisService) {}

  async listar(vinculoId: number, jtiAtual: string): Promise<SessaoDto[]> {
    const chaveIndice = activeSessionsKey(vinculoId);
    const jtis = await this.redis.smembers<string[]>(chaveIndice);
    if (jtis.length === 0) return [];

    const detalhes = await this.redis.mget<(DetalheSessao | null)[]>(
      ...jtis.map((jti) => sessionDetailKey(jti)),
    );

    const sessoes: SessaoDto[] = [];
    jtis.forEach((jti, i) => {
      const detalhe = detalhes[i];
      // jti sobrou no indice mas a chave de detalhe ja venceu: o indice so
      // limpa esses quando o proprio set fica parado tempo suficiente (ver
      // login.service.ts), entao filtra aqui em vez de confiar nele sozinho
      if (!detalhe) return;
      sessoes.push(
        plainToInstance(
          SessaoDto,
          {
            jti,
            ip: detalhe.ip,
            userAgent: detalhe.userAgent,
            criadoEm: detalhe.criadoEm,
            atual: jti === jtiAtual,
          },
          { excludeExtraneousValues: true },
        ),
      );
    });

    return sessoes.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  async revogar(vinculoId: number, jti: string): Promise<void> {
    const chaveIndice = activeSessionsKey(vinculoId);
    // confirma que o jti pertence a esse vinculo antes de revogar - sem
    // isso um cooperado autenticado poderia adivinhar/tentar jti de outro
    // vinculo e derrubar a sessao de outra pessoa (idor)
    const pertence = await this.redis.sismember(chaveIndice, jti);
    if (!pertence) {
      throw new NotFoundException('Sessão não encontrada.');
    }

    await Promise.all([
      this.redis.set(deniedSessionKey(jti), '1', { ex: SESSION_TTL_SECONDS }),
      this.redis.del(sessionDetailKey(jti)),
      this.redis.srem(chaveIndice, jti),
    ]);
  }
}
