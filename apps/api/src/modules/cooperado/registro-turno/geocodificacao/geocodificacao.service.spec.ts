import { Test, TestingModule } from '@nestjs/testing';
import { GeocodificacaoService } from './geocodificacao.service';
import { MapsApiService } from './maps-api.service';
import { PrismaService } from '../../../../core/prisma/prisma.service';

describe('GeocodificacaoService', () => {
  let service: GeocodificacaoService;
  let prisma: {
    registro_ponto: { findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  };
  let mapsApi: { buscarEnderecoReverso: jest.Mock };

  beforeEach(async () => {
    prisma = {
      registro_ponto: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    mapsApi = { buscarEnderecoReverso: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodificacaoService,
        { provide: PrismaService, useValue: prisma },
        { provide: MapsApiService, useValue: mapsApi },
      ],
    }).compile();

    service = module.get<GeocodificacaoService>(GeocodificacaoService);
  });

  it('não faz nada quando não há pendentes', async () => {
    prisma.registro_ponto.findMany.mockResolvedValue([]);

    await service.processarPendentes();

    expect(mapsApi.buscarEnderecoReverso).not.toHaveBeenCalled();
    expect(prisma.registro_ponto.update).not.toHaveBeenCalled();
  });

  it('grava o endereço encontrado e pula quando o maps retorna null', async () => {
    prisma.registro_ponto.findMany.mockResolvedValue([
      { id: 1, latitude: '-23.55', longitude: '-46.63' },
      { id: 2, latitude: '-23.56', longitude: '-46.64' },
    ]);
    mapsApi.buscarEnderecoReverso
      .mockResolvedValueOnce('Rua A, 123')
      .mockResolvedValueOnce(null);
    prisma.registro_ponto.update.mockResolvedValue({});

    await service.processarPendentes();

    expect(prisma.registro_ponto.update).toHaveBeenCalledTimes(1);
    expect(prisma.registro_ponto.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { endereco_reverso: 'Rua A, 123' },
    });
  });

  describe('processarUm (caminho do RabbitMQ)', () => {
    it('busca e grava o endereço de um registro pendente', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue({
        id: 1,
        latitude: '-23.55',
        longitude: '-46.63',
        endereco_reverso: null,
      });
      mapsApi.buscarEnderecoReverso.mockResolvedValue('Rua A, 123');
      prisma.registro_ponto.update.mockResolvedValue({});

      await service.processarUm(1);

      expect(prisma.registro_ponto.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { endereco_reverso: 'Rua A, 123' },
      });
    });

    it('não reprocessa quando o registro já tem endereço (evento duplicado/reentrega)', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue({
        id: 1,
        latitude: '-23.55',
        longitude: '-46.63',
        endereco_reverso: 'Rua A, 123',
      });

      await service.processarUm(1);

      expect(mapsApi.buscarEnderecoReverso).not.toHaveBeenCalled();
      expect(prisma.registro_ponto.update).not.toHaveBeenCalled();
    });

    it('não lança quando o registro não existe mais', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);

      await expect(service.processarUm(999)).resolves.toBeUndefined();
      expect(prisma.registro_ponto.update).not.toHaveBeenCalled();
    });
  });
});
