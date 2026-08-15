import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'argon2';
import { LoginService } from './login.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';

describe('LoginService', () => {
  let service: LoginService;
  const prisma = {
    vinculo_cooperativa: {
      findUnique: jest.fn(),
    },
  };
  const jwtService = { sign: jest.fn() };
  const redis = { eval: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
    jest.clearAllMocks();
    redis.eval.mockResolvedValue(1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registra o jti da sessão após autenticar', async () => {
    prisma.vinculo_cooperativa.findUnique.mockResolvedValue({
      id: 7,
      pessoa_id: 11,
      login: 'cooperado',
      senha_hash: await hash('Senha123'),
      coordenador: false,
      pessoa: { nome: 'Cooperado' },
      cooperativa: { id: 3, nome: 'Macrocoop', codigo: 'MACRO' },
    });
    jwtService.sign.mockReturnValue('token-jwt');

    await service.login(
      { usuario: 'cooperado', senha: 'Senha123' },
      { ip: '203.0.113.1', userAgent: 'Mozilla/5.0' },
    );

    expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Object), {
      jwtid: expect.any(String),
    });
    const jti = jwtService.sign.mock.calls[0][1].jwtid;
    expect(redis.eval).toHaveBeenCalledWith(
      expect.any(String),
      ['auth:sessoes:7', `auth:sessao:${jti}`],
      [jti, 3600, expect.any(String)],
    );

    // o detalhe vai como json na 3a posicao do argv - confere o conteudo,
    // nao so que "e uma string qualquer"
    const detalheJson = redis.eval.mock.calls[0][2][2];
    expect(JSON.parse(detalheJson)).toMatchObject({
      ip: '203.0.113.1',
      userAgent: 'Mozilla/5.0',
    });
  });
});
