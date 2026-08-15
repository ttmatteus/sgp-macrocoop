import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CurrentUserPayload } from '../../../core/auth/current-user.interface';
import {
  activeSessionsKey,
  sessionDetailKey,
  SESSION_TTL_SECONDS,
} from '../../../core/auth/session.constants';
import { RedisService } from '../../../core/redis/redis.service';

// o SADD/EXPIRE sozinho (como era antes) da TTL na chave inteira, nao por
// jti: se um login novo chega antes do set expirar, o EXPIRE reseta a chave
// toda e um jti ja vencido continua listado pra sempre. por isso a sessao
// tambem vira uma chave propria (KEYS[2]), com TTL individual de verdade -
// o set (KEYS[1]) passa a ser so indice de candidatos, filtrado na leitura
// (ver SessoesService.listar)
const REGISTER_SESSION_SCRIPT = `
redis.call('SADD', KEYS[1], ARGV[1])
redis.call('EXPIRE', KEYS[1], ARGV[2])
redis.call('SET', KEYS[2], ARGV[3], 'EX', ARGV[2])
return 1
`;

export interface LoginCredentials {
  usuario: string;
  senha: string;
}

export interface ContextoSessao {
  ip: string;
  userAgent: string;
}

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  async login(
    { usuario, senha }: LoginCredentials,
    contexto: ContextoSessao,
  ): Promise<{
    token: string;
    user: Omit<CurrentUserPayload, 'jti' | 'iat' | 'exp'>;
  }> {
    const vinculo = await this.prisma.vinculo_cooperativa.findUnique({
      where: { login: usuario },
      include: { pessoa: true, cooperativa: true },
    });

    if (!vinculo || !(await verify(vinculo.senha_hash, senha))) {
      throw new UnauthorizedException();
    }

    const jti = randomUUID();
    // jti/iat/exp saem daqui de proposito: quem preenche esses 3 é o proprio
    // jwt na hora de assinar, a gente so monta os claims da aplicacao
    const payload: Omit<CurrentUserPayload, 'jti' | 'iat' | 'exp'> = {
      vinculoId: vinculo.id,
      pessoaId: vinculo.pessoa_id,
      login: vinculo.login,
      nome: vinculo.pessoa.nome,
      // gambiarra by design: ainda n tem nivel/permissao de vdd no schema
      nivel: vinculo.coordenador ? 'coordenador' : 'cooperado',
      permissoes: [],
      cooperativa: {
        id: vinculo.cooperativa.id,
        nome: vinculo.cooperativa.nome,
        codigo: vinculo.cooperativa.codigo,
      },
    };

    const token = this.jwtService.sign(payload, { jwtid: jti });
    const detalheSessao = {
      ip: contexto.ip,
      userAgent: contexto.userAgent,
      criadoEm: new Date().toISOString(),
    };
    // de proposito sem try/catch: se o redis cair o login falha msm. sessao que
    // nasce fora dessa lista n aparece pro invalidarSessoes depois, ai trocar a
    // senha n derrubava ela. o guard tb ja depende do redis pra ler a denylist
    await this.redis.eval(
      REGISTER_SESSION_SCRIPT,
      [activeSessionsKey(vinculo.id), sessionDetailKey(jti)],
      [jti, SESSION_TTL_SECONDS, JSON.stringify(detalheSessao)],
    );
    // devolve o payload tb pq o cookie é httpOnly, o front n consegue ler o jwt
    return { token, user: payload };
  }
}
