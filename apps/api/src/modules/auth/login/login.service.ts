import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CurrentUserPayload } from '../../../core/auth/current-user.interface';

export interface LoginCredentials {
  usuario: string;
  senha: string;
}

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login({
    usuario,
    senha,
  }: LoginCredentials): Promise<{ token: string; user: Omit<CurrentUserPayload, 'jti'> }> {
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
      // gambiarra by design: ainda n tem nivel/permissao de vdd no schema, então por enquanto é só isso
      nivel: vinculo.coordenador ? 'coordenador' : 'cooperado',
      permissoes: [],
      cooperativa: {
        id: vinculo.cooperativa.id,
        nome: vinculo.cooperativa.nome,
        codigo: vinculo.cooperativa.codigo,
      },
    };

    const token = this.jwtService.sign(payload, { jwtid: jti });
    // devolve o payload tb pq o cookie é httpOnly, o front n consegue ler o jwt sozinho
    return { token, user: payload };
  }
}
