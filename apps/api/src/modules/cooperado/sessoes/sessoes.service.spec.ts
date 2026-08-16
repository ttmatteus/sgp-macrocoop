import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'argon2';
import { SessoesService } from './sessoes.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';

describe('SessoesService', () => {
  let service: SessoesService;
  const prisma = {
    vinculo_cooperativa: { findUnique: jest.fn() },
  };
  const redis = {
    smembers: jest.fn(),
    mget: jest.fn(),
    sismember: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    srem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessoesService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get<SessoesService>(SessoesService);
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('retorna vazio sem consultar detalhe quando nao ha jti no indice', async () => {
      redis.smembers.mockResolvedValue([]);

      const resultado = await service.listar(1, 'jti-atual');

      expect(resultado).toEqual([]);
      expect(redis.mget).not.toHaveBeenCalled();
    });

    it('descarta jti cujo detalhe ja expirou (sessao fantasma)', async () => {
      redis.smembers.mockResolvedValue(['jti-vivo', 'jti-morto']);
      redis.mget.mockResolvedValue([
        { ip: '1.1.1.1', userAgent: 'Chrome', criadoEm: '2026-08-01T10:00:00.000Z' },
        null,
      ]);

      const resultado = await service.listar(1, 'jti-atual');

      expect(resultado).toHaveLength(1);
      expect(resultado[0].jti).toBe('jti-vivo');
    });

    it('marca a sessao atual', async () => {
      redis.smembers.mockResolvedValue(['jti-atual', 'jti-outra']);
      redis.mget.mockResolvedValue([
        { ip: '1.1.1.1', userAgent: 'Chrome', criadoEm: '2026-08-01T10:00:00.000Z' },
        { ip: '2.2.2.2', userAgent: 'Safari', criadoEm: '2026-08-02T10:00:00.000Z' },
      ]);

      const resultado = await service.listar(1, 'jti-atual');

      expect(resultado.find((s) => s.jti === 'jti-atual')?.atual).toBe(true);
      expect(resultado.find((s) => s.jti === 'jti-outra')?.atual).toBe(false);
    });

    it('ordena da mais recente pra mais antiga', async () => {
      redis.smembers.mockResolvedValue(['jti-antiga', 'jti-nova']);
      redis.mget.mockResolvedValue([
        { ip: '1.1.1.1', userAgent: 'Chrome', criadoEm: '2026-08-01T10:00:00.000Z' },
        { ip: '2.2.2.2', userAgent: 'Safari', criadoEm: '2026-08-10T10:00:00.000Z' },
      ]);

      const resultado = await service.listar(1, 'x');

      expect(resultado.map((s) => s.jti)).toEqual(['jti-nova', 'jti-antiga']);
    });
  });

  describe('revogar (uma sessao)', () => {
    it('recusa com senha errada antes de tocar no redis', async () => {
      prisma.vinculo_cooperativa.findUnique.mockResolvedValue({
        senha_hash: await hash('SenhaCerta123'),
      });

      await expect(service.revogar(1, 'jti-x', 'SenhaErrada')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redis.sismember).not.toHaveBeenCalled();
    });

    it('recusa revogar jti que nao pertence ao vinculo (idor), mesmo com senha certa', async () => {
      prisma.vinculo_cooperativa.findUnique.mockResolvedValue({
        senha_hash: await hash('SenhaCerta123'),
      });
      redis.sismember.mockResolvedValue(0);

      await expect(
        service.revogar(1, 'jti-de-outro-vinculo', 'SenhaCerta123'),
      ).rejects.toThrow(NotFoundException);
      expect(redis.set).not.toHaveBeenCalled();
    });

    it('denylista, apaga o detalhe e remove do indice com senha certa', async () => {
      prisma.vinculo_cooperativa.findUnique.mockResolvedValue({
        senha_hash: await hash('SenhaCerta123'),
      });
      redis.sismember.mockResolvedValue(1);

      await service.revogar(7, 'jti-x', 'SenhaCerta123');

      expect(redis.set).toHaveBeenCalledWith('denylist:jti:jti-x', '1', { ex: 3600 });
      expect(redis.del).toHaveBeenCalledWith('auth:sessao:jti-x');
      expect(redis.srem).toHaveBeenCalledWith('auth:sessoes:7', 'jti-x');
    });
  });

  describe('revogarTodas', () => {
    it('recusa com senha errada', async () => {
      prisma.vinculo_cooperativa.findUnique.mockResolvedValue({
        senha_hash: await hash('SenhaCerta123'),
      });

      await expect(service.revogarTodas(1, 'SenhaErrada')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redis.smembers).not.toHaveBeenCalled();
    });

    it('revoga tudo (inclusive a sessao atual) com senha certa', async () => {
      prisma.vinculo_cooperativa.findUnique.mockResolvedValue({
        senha_hash: await hash('SenhaCerta123'),
      });
      redis.smembers.mockResolvedValue(['jti-1', 'jti-2']);

      await service.revogarTodas(7, 'SenhaCerta123');

      expect(redis.set).toHaveBeenCalledWith('denylist:jti:jti-1', '1', { ex: 3600 });
      expect(redis.set).toHaveBeenCalledWith('denylist:jti:jti-2', '1', { ex: 3600 });
      expect(redis.del).toHaveBeenCalledWith('auth:sessoes:7');
    });
  });
});
