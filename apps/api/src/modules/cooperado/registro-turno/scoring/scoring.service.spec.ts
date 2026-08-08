import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';
import { PrismaService } from '../../../../core/prisma/prisma.service';

describe('ScoringService', () => {
  let service: ScoringService;
  let prisma: {
    registro_ponto: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  const base = {
    id: 1,
    vinculo_cooperativa_id: 1,
    registrado_em: new Date('2026-08-05T11:00:00Z'),
    latitude: '-23.55052',
    longitude: '-46.63331',
    precisao_m: '10',
    status_localizacao: 'dentro',
    origem: 'online',
    score_calculado_em: null as Date | null,
  };

  beforeEach(async () => {
    prisma = {
      registro_ponto: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoringService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  async function rodarComRegistro(registro: typeof base) {
    prisma.registro_ponto.findMany.mockResolvedValue([registro]);
    prisma.registro_ponto.updateMany.mockResolvedValue({ count: 1 });
    prisma.registro_ponto.update.mockResolvedValue({});
    await service.processarPendentes();
    return prisma.registro_ponto.update.mock.calls[0][0].data.score_fraude as number;
  }

  it('score 0 quando não há nenhum indício e não há batida anterior', async () => {
    prisma.registro_ponto.findFirst.mockResolvedValue(null);
    const score = await rodarComRegistro(base);
    expect(score).toBe(0);
  });

  it('soma 40 quando a batida foi fora do raio', async () => {
    prisma.registro_ponto.findFirst.mockResolvedValue(null);
    const score = await rodarComRegistro({ ...base, status_localizacao: 'fora' });
    expect(score).toBe(40);
  });

  it('soma 20 quando a precisão do GPS está ruim', async () => {
    prisma.registro_ponto.findFirst.mockResolvedValue(null);
    const score = await rodarComRegistro({ ...base, precisao_m: '999' });
    expect(score).toBe(20);
  });

  it('soma 15 quando veio de reenvio offline', async () => {
    prisma.registro_ponto.findFirst.mockResolvedValue(null);
    const score = await rodarComRegistro({ ...base, origem: 'offline_sync' });
    expect(score).toBe(15);
  });

  it('soma 15 quando a coordenada é idêntica à batida anterior', async () => {
    prisma.registro_ponto.findFirst.mockResolvedValue({
      latitude: base.latitude,
      longitude: base.longitude,
      registrado_em: new Date('2026-08-05T03:00:00Z'),
    });
    const score = await rodarComRegistro(base);
    expect(score).toBe(15);
  });

  it('soma 30 quando a velocidade entre as duas batidas é impossível', async () => {
    prisma.registro_ponto.findFirst.mockResolvedValue({
      latitude: '-22.9068',
      longitude: '-43.1729',
      registrado_em: new Date('2026-08-05T10:55:00Z'),
    });
    const score = await rodarComRegistro(base);
    expect(score).toBe(30);
  });

  it('nunca ultrapassa 100 mesmo somando todos os indícios', async () => {
    prisma.registro_ponto.findFirst.mockResolvedValue({
      latitude: '-22.9068',
      longitude: '-43.1729',
      registrado_em: new Date('2026-08-05T10:55:00Z'),
    });
    const score = await rodarComRegistro({
      ...base,
      status_localizacao: 'fora',
      precisao_m: '999',
      origem: 'offline_sync',
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  it('não chama update quando não há pendentes', async () => {
    prisma.registro_ponto.findMany.mockResolvedValue([]);
    await service.processarPendentes();
    expect(prisma.registro_ponto.update).not.toHaveBeenCalled();
  });

  it('pula o cálculo quando outra instância já reivindicou a linha', async () => {
    prisma.registro_ponto.findMany.mockResolvedValue([base]);
    prisma.registro_ponto.updateMany.mockResolvedValue({ count: 0 });

    await service.processarPendentes();

    expect(prisma.registro_ponto.findFirst).not.toHaveBeenCalled();
    expect(prisma.registro_ponto.update).not.toHaveBeenCalled();
  });

  it('libera a reivindicação (volta score_calculado_em pra null) quando o cálculo falha', async () => {
    prisma.registro_ponto.findMany.mockResolvedValue([base]);
    prisma.registro_ponto.updateMany.mockResolvedValue({ count: 1 });
    prisma.registro_ponto.findFirst.mockRejectedValue(new Error('banco fora do ar'));
    prisma.registro_ponto.update.mockResolvedValue({});

    await service.processarPendentes();

    expect(prisma.registro_ponto.update).toHaveBeenCalledWith({
      where: { id: base.id },
      data: { score_calculado_em: null },
    });
  });

  describe('processarUm (caminho do RabbitMQ)', () => {
    it('calcula e grava o score de um registro pendente', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue({ ...base, score_fraude: null });
      prisma.registro_ponto.findFirst.mockResolvedValue(null);
      prisma.registro_ponto.updateMany.mockResolvedValue({ count: 1 });
      prisma.registro_ponto.update.mockResolvedValue({});

      await service.processarUm(1);

      expect(prisma.registro_ponto.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 }, data: expect.objectContaining({ score_fraude: 0 }) }),
      );
    });

    it('não reprocessa quando o registro já foi calculado (evento duplicado/reentrega)', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue({ ...base, score_calculado_em: new Date() });

      await service.processarUm(1);

      expect(prisma.registro_ponto.update).not.toHaveBeenCalled();
    });

    it('não lança quando o registro não existe mais', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);

      await expect(service.processarUm(999)).resolves.toBeUndefined();
      expect(prisma.registro_ponto.update).not.toHaveBeenCalled();
    });
  });
});
