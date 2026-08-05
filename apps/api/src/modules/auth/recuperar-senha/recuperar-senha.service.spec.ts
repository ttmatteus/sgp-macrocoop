import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, GoneException } from '@nestjs/common';
import { verify } from 'argon2';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { RecuperarSenhaService } from './recuperar-senha.service';

describe('RecuperarSenhaService', () => {
  let service: RecuperarSenhaService;
  const prisma = {
    vinculo_cooperativa: {
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const redis = {
    eval: jest.fn(),
    smembers: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecuperarSenhaService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<RecuperarSenhaService>(RecuperarSenhaService);
    jest.clearAllMocks();
    redis.eval.mockResolvedValue(1);
    redis.smembers.mockResolvedValue([]);
    redis.set.mockResolvedValue('OK');
    redis.del.mockResolvedValue(1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('gera e persiste token por usuário', async () => {
    prisma.vinculo_cooperativa.findFirst.mockResolvedValue({ id: 7 });
    prisma.vinculo_cooperativa.update.mockResolvedValue({ id: 7 });

    const resposta = await service.solicitarPorUsuario(
      ' Cooperado ',
      '127.0.0.1',
    );

    expect(resposta.modo).toBe('dev');
    expect(resposta.sucesso).toBe(true);
    expect(resposta.token).toHaveLength(64);
    expect(prisma.vinculo_cooperativa.findFirst).toHaveBeenCalledWith({
      where: { login: { equals: 'cooperado', mode: 'insensitive' } },
      select: { id: true },
    });
    expect(prisma.vinculo_cooperativa.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        token_redefinicao: expect.not.stringMatching(resposta.token),
        token_redefinicao_expira_em: expect.any(Date),
      },
    });
    expect(redis.eval).toHaveBeenCalledWith(
      expect.any(String),
      [expect.stringMatching(/^auth:recuperacao:/)],
      [900],
    );
  });

  it('gera resposta indistinguível quando usuário não existe', async () => {
    prisma.vinculo_cooperativa.findFirst.mockResolvedValue(null);

    const resposta = await service.solicitarPorUsuario(
      'inexistente',
      '127.0.0.1',
    );

    expect(resposta.token).toHaveLength(64);
    expect(prisma.vinculo_cooperativa.update).not.toHaveBeenCalled();
  });

  it('localiza a conta por e-mail cadastrado', async () => {
    prisma.vinculo_cooperativa.findFirst.mockResolvedValue({ id: 8 });
    prisma.vinculo_cooperativa.update.mockResolvedValue({ id: 8 });

    await service.solicitarPorEmail(
      ' Cooperado@Macrocoop.com.br ',
      '127.0.0.1',
    );

    expect(prisma.vinculo_cooperativa.findFirst).toHaveBeenCalledWith({
      where: {
        pessoa: {
          email: {
            equals: 'cooperado@macrocoop.com.br',
            mode: 'insensitive',
          },
        },
      },
      select: { id: true },
    });
  });

  it('retorna 429 após três solicitações na janela', async () => {
    redis.eval.mockResolvedValue(4);

    await expect(
      service.solicitarPorUsuario('cooperado', '127.0.0.1'),
    ).rejects.toMatchObject({ status: 429 });
    expect(prisma.vinculo_cooperativa.findFirst).not.toHaveBeenCalled();
  });

  it('rejeita token inválido', async () => {
    prisma.vinculo_cooperativa.findFirst.mockResolvedValue(null);

    await expect(
      service.redefinir('token-invalido', 'Senha123'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('limpa e rejeita token expirado com status 410', async () => {
    prisma.vinculo_cooperativa.findFirst.mockResolvedValue({
      id: 7,
      token_redefinicao_expira_em: new Date(Date.now() - 1000),
    });
    prisma.vinculo_cooperativa.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.redefinir('token-expirado', 'Senha123'),
    ).rejects.toBeInstanceOf(GoneException);
    expect(prisma.vinculo_cooperativa.updateMany).toHaveBeenCalledWith({
      where: { id: 7, token_redefinicao: expect.any(String) },
      data: {
        token_redefinicao: null,
        token_redefinicao_expira_em: null,
      },
    });
  });

  it('troca a senha e invalida sessões ativas', async () => {
    prisma.vinculo_cooperativa.findFirst.mockResolvedValue({
      id: 7,
      token_redefinicao_expira_em: new Date(Date.now() + 60_000),
    });
    prisma.vinculo_cooperativa.updateMany.mockResolvedValue({ count: 1 });
    redis.smembers.mockResolvedValue(['jti-1', 'jti-2']);

    await expect(
      service.redefinir('token-valido', 'Senha123'),
    ).resolves.toEqual({
      sucesso: true,
      mensagem: 'Senha redefinida com sucesso.',
    });

    const atualizacao = prisma.vinculo_cooperativa.updateMany.mock.calls[0][0];
    expect(await verify(atualizacao.data.senha_hash, 'Senha123')).toBe(true);
    expect(
      prisma.vinculo_cooperativa.updateMany.mock.invocationCallOrder[0],
    ).toBeLessThan(redis.smembers.mock.invocationCallOrder[0]);
    expect(redis.set).toHaveBeenCalledTimes(2);
    expect(redis.set).toHaveBeenCalledWith('denylist:jti:jti-1', '1', {
      ex: 3600,
    });
    expect(redis.del).toHaveBeenCalledWith('auth:sessoes:7');
    expect(atualizacao.data).toEqual({
      senha_hash: expect.any(String),
      token_redefinicao: null,
      token_redefinicao_expira_em: null,
    });
  });

  it('impede reutilização concorrente do token', async () => {
    prisma.vinculo_cooperativa.findFirst.mockResolvedValue({
      id: 7,
      token_redefinicao_expira_em: new Date(Date.now() + 60_000),
    });
    prisma.vinculo_cooperativa.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.redefinir('token-usado', 'Senha123'),
    ).rejects.toBeInstanceOf(GoneException);
    expect(redis.smembers).not.toHaveBeenCalled();
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('retorna os dados associados ao token válido', async () => {
    prisma.vinculo_cooperativa.findFirst.mockResolvedValue({
      id: 7,
      login: 'cooperado',
      token_redefinicao_expira_em: new Date(Date.now() + 60_000),
      pessoa: { nome: 'Cooperado' },
    });

    await expect(service.consultarToken('token-valido')).resolves.toEqual({
      usuario: 'cooperado',
      nome: 'Cooperado',
      tokenValido: true,
    });
  });
});
