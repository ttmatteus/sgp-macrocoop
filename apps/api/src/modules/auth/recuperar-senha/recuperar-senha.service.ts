import {
  BadRequestException,
  GoneException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { hash } from 'argon2';
import { revogarTodasAsSessoes } from '../../../core/auth/sessions';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';

const TOKEN_TTL_MS = 15 * 60 * 1000;
const RATE_LIMIT_TTL_SECONDS = 15 * 60;
const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_MAX_POR_IP = 10;
const RATE_LIMIT_SCRIPT = `
local total = redis.call('INCR', KEYS[1])
if total == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return total
`;

export interface SolicitacaoRecuperacaoResposta {
  sucesso: true;
  modo: 'dev';
  token: string;
  expiracaoToken: string;
}

@Injectable()
export class RecuperarSenhaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async solicitarPorUsuario(
    usuario: string,
    ip: string,
  ): Promise<SolicitacaoRecuperacaoResposta> {
    const identificador = this.normalizarIdentificador(usuario);
    await this.verificarLimite(identificador, ip);

    const vinculo = await this.prisma.vinculo_cooperativa.findFirst({
      where: { login: { equals: identificador, mode: 'insensitive' } },
      select: { id: true },
    });

    return this.gerarToken(vinculo?.id);
  }

  async solicitarPorEmail(
    email: string,
    ip: string,
  ): Promise<SolicitacaoRecuperacaoResposta> {
    const identificador = this.normalizarIdentificador(email);
    await this.verificarLimite(identificador, ip);

    const vinculo = await this.prisma.vinculo_cooperativa.findFirst({
      where: {
        pessoa: {
          email: { equals: identificador, mode: 'insensitive' },
        },
      },
      select: { id: true },
    });

    return this.gerarToken(vinculo?.id);
  }

  async redefinir(token: string, senha: string) {
    const { vinculo, tokenHash, agora } = await this.obterTokenValido(token);

    const senhaHash = await hash(senha);
    const atualizacao = await this.prisma.vinculo_cooperativa.updateMany({
      where: {
        id: vinculo.id,
        token_redefinicao: tokenHash,
        token_redefinicao_expira_em: { gt: agora },
      },
      data: {
        senha_hash: senhaHash,
        token_redefinicao: null,
        token_redefinicao_expira_em: null,
      },
    });

    if (atualizacao.count === 0) {
      throw new GoneException('Token de redefinição expirado.');
    }

    await revogarTodasAsSessoes(this.redis, vinculo.id);

    return { sucesso: true, mensagem: 'Senha redefinida com sucesso.' };
  }

  async consultarToken(token: string) {
    const { vinculo } = await this.obterTokenValido(token);

    return {
      usuario: vinculo.login,
      nome: vinculo.pessoa.nome,
      tokenValido: true,
    };
  }

  private async gerarToken(
    vinculoId?: number,
  ): Promise<SolicitacaoRecuperacaoResposta> {
    const token = randomBytes(32).toString('hex');
    const expiraEm = new Date(Date.now() + TOKEN_TTL_MS);

    if (vinculoId) {
      await this.prisma.vinculo_cooperativa.update({
        where: { id: vinculoId },
        data: {
          token_redefinicao: this.criarHash(token),
          token_redefinicao_expira_em: expiraEm,
        },
      });
    }

    return {
      sucesso: true,
      modo: 'dev',
      token,
      expiracaoToken: expiraEm.toISOString(),
    };
  }

  private async obterTokenValido(token: string) {
    const tokenHash = this.criarHash(token);
    const vinculo = await this.prisma.vinculo_cooperativa.findFirst({
      where: { token_redefinicao: tokenHash },
      select: {
        id: true,
        login: true,
        token_redefinicao_expira_em: true,
        pessoa: { select: { nome: true } },
      },
    });

    if (!vinculo) {
      throw new BadRequestException('Token de redefinição inválido.');
    }

    const agora = new Date();
    if (
      !vinculo.token_redefinicao_expira_em ||
      vinculo.token_redefinicao_expira_em <= agora
    ) {
      await this.limparToken(vinculo.id, tokenHash);
      throw new GoneException('Token de redefinição expirado.');
    }

    return { vinculo, tokenHash, agora };
  }

  private async verificarLimite(identificador: string, ip: string) {
    const identificadorHash = this.criarHash(identificador);
    const ipHash = this.criarHash(ip || 'desconhecido');

    // dois limites: um por identificador digitado (segura insistencia na mesma
    // conta) e um teto por ip. sem o teto, bastava trocar o usuario/email a cada
    // request pra mandar solicitacao infinita da mesma origem
    await this.aplicarLimite(
      `auth:recuperacao:${identificadorHash}:${ipHash}`,
      RATE_LIMIT_MAX_REQUESTS,
    );
    await this.aplicarLimite(
      `auth:recuperacao:ip:${ipHash}`,
      RATE_LIMIT_MAX_POR_IP,
    );
  }

  private async aplicarLimite(chave: string, maximo: number) {
    const total = await this.incrementarContador(chave);

    if (total > maximo) {
      throw new HttpException(
        'Limite de solicitações de recuperação excedido.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async incrementarContador(chave: string) {
    return this.redis.eval<[number], number>(
      RATE_LIMIT_SCRIPT,
      [chave],
      [RATE_LIMIT_TTL_SECONDS],
    );
  }

  private limparToken(vinculoId: number, tokenHash: string) {
    return this.prisma.vinculo_cooperativa.updateMany({
      where: { id: vinculoId, token_redefinicao: tokenHash },
      data: {
        token_redefinicao: null,
        token_redefinicao_expira_em: null,
      },
    });
  }

  private normalizarIdentificador(identificador: string) {
    return identificador.trim().toLowerCase();
  }

  private criarHash(valor: string) {
    return createHash('sha256').update(valor).digest('hex');
  }
}
