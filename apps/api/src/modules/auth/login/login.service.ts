import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CurrentUserPayload } from '../../../core/auth/current-user.interface';
import {
  activeSessionsKey,
  SESSION_TTL_SECONDS,
} from '../../../core/auth/session.constants';
import { RedisService } from '../../../core/redis/redis.service';

const REGISTER_SESSION_SCRIPT = `
redis.call('SADD', KEYS[1], ARGV[1])
redis.call('EXPIRE', KEYS[1], ARGV[2])
return 1
`;

export interface LoginCredentials {
  usuario: string;
  senha: string;
}

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  async login({ usuario, senha }: LoginCredentials): Promise<{
    token: string;
    user: Omit<CurrentUserPayload, 'jti'>;
  }> {
    const vinculo = await this.prisma.vinculo_cooperativa.findUnique({
      where: { login: usuario },
      include: { pessoa: true, cooperativa: true },
    });

    if (!vinculo || !(await verify(vinculo.senha_hash, senha))) {
      throw new UnauthorizedException();
    }

    const jti = randomUUID();
    const payload: Omit<CurrentUserPayload, 'jti'> = {
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
    // de proposito sem try/catch: se o redis cair o login falha msm. sessao que
    // nasce fora dessa lista n aparece pro invalidarSessoes depois, ai trocar a
    // senha n derrubava ela. o guard tb ja depende do redis pra ler a denylist
    await this.redis.eval(
      REGISTER_SESSION_SCRIPT,
      [activeSessionsKey(vinculo.id)],
      [jti, SESSION_TTL_SECONDS],
    );
    // devolve o payload tb pq o cookie é httpOnly, o front n consegue ler o jwt
    return { token, user: payload };
  }
}
