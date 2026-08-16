import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { activeSessionsKey, sessionDetailKey } from '../../../core/auth/session.constants';
import { revogarTodasAsSessoes, revogarUmaSessao } from '../../../core/auth/sessions';
import { SessaoDto } from './dto/sessoes.dto';

interface DetalheSessao {
  ip: string;
  userAgent: string;
  criadoEm: string;
}

@Injectable()
export class SessoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

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
      // jti pode ter sobrado no indice com o detalhe ja expirado
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

  async revogar(vinculoId: number, jti: string, senha: string): Promise<void> {
    await this.confirmarSenha(vinculoId, senha);

    const revogou = await revogarUmaSessao(this.redis, vinculoId, jti);
    if (!revogou) {
      throw new NotFoundException('Sessão não encontrada.');
    }
  }

  async revogarTodas(vinculoId: number, senha: string): Promise<void> {
    await this.confirmarSenha(vinculoId, senha);
    await revogarTodasAsSessoes(this.redis, vinculoId);
  }

  private async confirmarSenha(vinculoId: number, senha: string): Promise<void> {
    const vinculo = await this.prisma.vinculo_cooperativa.findUnique({
      where: { id: vinculoId },
    });

    if (!vinculo || !(await argon2.verify(vinculo.senha_hash, senha))) {
      throw new UnauthorizedException('Senha incorreta.');
    }
  }
}
