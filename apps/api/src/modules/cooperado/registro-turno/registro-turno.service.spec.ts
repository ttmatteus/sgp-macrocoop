import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RegistroTurnoService } from './registro-turno.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RabbitmqPublisherService } from '../../../core/rabbitmq/rabbitmq-publisher.service';
import { Prisma } from '../../../generated/prisma/client';
import { RegistrarPontoDto } from './dto/registro-turno.dto';

function erroUniqueConstraint(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('duplicate key value violates unique constraint', {
    code: 'P2002',
    clientVersion: '7.9.1',
  });
}

type PrismaMock = {
  registro_ponto: { findUnique: jest.Mock; create: jest.Mock };
  alocacao: { findFirst: jest.Mock; findMany: jest.Mock };
  turno: { findFirst: jest.Mock; create: jest.Mock; updateMany: jest.Mock };
  local_ponto: { findMany: jest.Mock };
  $transaction: jest.Mock;
};

describe('RegistroTurnoService', () => {
  let service: RegistroTurnoService;
  let prisma: PrismaMock;
  let rabbitmqPublisher: { publicarPontoRegistrado: jest.Mock };

  const local500 = {
    id: 10,
    contrato_id: 1,
    nome: 'Portaria',
    latitude: '-23.55052000',
    longitude: '-46.63331000',
    raio_m: 500,
    ativo: true,
  };

  const dadosBase: RegistrarPontoDto = {
    idCliente: '11111111-1111-1111-1111-111111111111',
    contratoId: 1,
    tipo: 'entrada',
    registradoEm: new Date().toISOString(),
    latitude: -23.55052,
    longitude: -46.63331,
    precisaoM: 10,
  };

  beforeEach(async () => {
    prisma = {
      registro_ponto: { findUnique: jest.fn(), create: jest.fn() },
      alocacao: { findFirst: jest.fn(), findMany: jest.fn() },
      turno: { findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
      local_ponto: { findMany: jest.fn() },
      $transaction: jest.fn((callback: (tx: PrismaMock) => unknown) => callback(prisma)),
    };

    // geofence roda em paralelo no registrar(): precisa resolver mesmo nos
    // testes que vao cair num 409/422 antes de usar o resultado
    prisma.local_ponto.findMany.mockResolvedValue([]);

    rabbitmqPublisher = { publicarPontoRegistrado: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistroTurnoService,
        { provide: PrismaService, useValue: prisma },
        { provide: RabbitmqPublisherService, useValue: rabbitmqPublisher },
      ],
    }).compile();

    service = module.get<RegistroTurnoService>(RegistroTurnoService);
  });

  describe('registrar', () => {
    it('devolve o registro existente sem duplicar quando o idCliente já foi processado (reenvio offline)', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue({
        id: 99,
        tipo: 'entrada',
        registrado_em: new Date(),
        status_localizacao: 'dentro',
        distancia_contrato_m: '12.50',
      });
      prisma.turno.findFirst.mockResolvedValue({ id: 5 });

      const resultado = await service.registrar(1, dadosBase);

      expect(resultado.criado).toBe(false);
      expect(resultado.dto.id).toBe(99);
      expect(resultado.dto.turnoId).toBe(5);
      expect(prisma.alocacao.findFirst).not.toHaveBeenCalled();
    });

    it('lança 422 quando não há alocação ativa nesse contrato', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue(null);

      await expect(service.registrar(1, dadosBase)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('lança 409 pra entrada quando já existe turno aberto', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue({ id: 5, contrato_id: 1 });

      await expect(service.registrar(1, dadosBase)).rejects.toThrow(ConflictException);
    });

    it('lança 409 pra saída quando não existe turno aberto', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue(null);

      await expect(
        service.registrar(1, { ...dadosBase, tipo: 'saida' }),
      ).rejects.toThrow(ConflictException);
    });

    it('lança 409 pra saída quando o turno aberto é de outro contrato', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue({ id: 5, contrato_id: 2 });

      await expect(
        service.registrar(1, { ...dadosBase, tipo: 'saida' }),
      ).rejects.toThrow(ConflictException);
    });

    it('cria registro e turno quando a batida está dentro do raio', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue(null);
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.registro_ponto.create.mockResolvedValue({
        id: 1,
        tipo: 'entrada',
        registrado_em: new Date(),
        status_localizacao: 'dentro',
        distancia_contrato_m: '5.00',
      });
      prisma.turno.create.mockResolvedValue({ id: 42 });

      const resultado = await service.registrar(1, dadosBase);

      expect(resultado.criado).toBe(true);
      expect(resultado.dto.turnoId).toBe(42);
      expect(prisma.registro_ponto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status_localizacao: 'dentro' }),
        }),
      );
      // turno nasce 'aberto': a constraint turno_coerente do banco exige isso
      // enquanto nao tem saida, 'no_horario' aqui quebraria a constraint de verdade
      expect(prisma.turno.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'aberto' }),
        }),
      );
      expect(rabbitmqPublisher.publicarPontoRegistrado).toHaveBeenCalledWith(1);
    });

    it('não publica de novo quando é reenvio idempotente (registro já existia)', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue({
        id: 99,
        tipo: 'entrada',
        registrado_em: new Date(),
        status_localizacao: 'dentro',
        distancia_contrato_m: '5.00',
      });
      prisma.turno.findFirst.mockResolvedValue({ id: 5 });

      await service.registrar(1, dadosBase);

      expect(rabbitmqPublisher.publicarPontoRegistrado).not.toHaveBeenCalled();
    });

    it('resolve a corrida entre duas entradas quase simultâneas devolvendo o registro que venceu', async () => {
      // duas requisicoes com o mesmo idCliente passam pela checagem antes da
      // transacao (nenhuma via a outra ainda), so a constraint do banco pega
      prisma.registro_ponto.findUnique
        .mockResolvedValueOnce(null) // checagem de idempotencia antes da transacao
        .mockResolvedValueOnce({
          id: 77,
          tipo: 'entrada',
          registrado_em: new Date(),
          status_localizacao: 'dentro',
          distancia_contrato_m: '5.00',
        }); // reconsulta depois do P2002, acha o que a outra requisicao criou
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue(null);
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.$transaction.mockRejectedValue(erroUniqueConstraint());

      const resultado = await service.registrar(1, dadosBase);

      expect(resultado.criado).toBe(false);
      expect(resultado.dto.id).toBe(77);
      // registro 77 foi criado pela OUTRA requisicao, que publica pelo lado dela.
      // essa aqui so leu, nao pode publicar de novo
      expect(rabbitmqPublisher.publicarPontoRegistrado).not.toHaveBeenCalled();
    });

    it('lança 409 quando a corrida é de duas entradas concorrentes disputando o turno único aberto', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue(null);
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.$transaction.mockRejectedValue(erroUniqueConstraint());

      await expect(service.registrar(1, dadosBase)).rejects.toThrow(ConflictException);
    });

    it('propaga erros que não são de unique constraint sem mascarar', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue(null);
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.$transaction.mockRejectedValue(new Error('banco fora do ar'));

      await expect(service.registrar(1, dadosBase)).rejects.toThrow('banco fora do ar');
    });

    it('grava status fora quando a coordenada está longe de todos os locais do contrato', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue(null);
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.registro_ponto.create.mockResolvedValue({
        id: 1,
        tipo: 'entrada',
        registrado_em: new Date(),
        status_localizacao: 'fora',
        distancia_contrato_m: '9999.00',
      });
      prisma.turno.create.mockResolvedValue({ id: 42 });

      await service.registrar(1, { ...dadosBase, latitude: -23.7, longitude: -46.9 });

      expect(prisma.registro_ponto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status_localizacao: 'fora' }),
        }),
      );
    });

    it('grava status indeterminado quando o contrato não tem local de ponto cadastrado', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue(null);
      prisma.local_ponto.findMany.mockResolvedValue([]);
      prisma.registro_ponto.create.mockResolvedValue({
        id: 1,
        tipo: 'entrada',
        registrado_em: new Date(),
        status_localizacao: 'indeterminado',
        distancia_contrato_m: null,
      });
      prisma.turno.create.mockResolvedValue({ id: 42 });

      await service.registrar(1, dadosBase);

      expect(prisma.registro_ponto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status_localizacao: 'indeterminado',
            local_ponto_id: null,
          }),
        }),
      );
    });

    it('grava status indeterminado quando a precisão do GPS é ruim, mesmo dentro do raio', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue(null);
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.registro_ponto.create.mockResolvedValue({
        id: 1,
        tipo: 'entrada',
        registrado_em: new Date(),
        status_localizacao: 'indeterminado',
        distancia_contrato_m: '5.00',
      });
      prisma.turno.create.mockResolvedValue({ id: 42 });

      await service.registrar(1, { ...dadosBase, precisaoM: 999 });

      expect(prisma.registro_ponto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status_localizacao: 'indeterminado' }),
        }),
      );
    });

    it('não deixa precisão ruim apagar um "fora" já calculado (evasão de geofence)', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue(null);
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.registro_ponto.create.mockResolvedValue({
        id: 1,
        tipo: 'entrada',
        registrado_em: new Date(),
        status_localizacao: 'fora',
        distancia_contrato_m: '31850.14',
      });
      prisma.turno.create.mockResolvedValue({ id: 42 });

      await service.registrar(1, {
        ...dadosBase,
        latitude: -23.7,
        longitude: -46.9,
        precisaoM: 999,
      });

      expect(prisma.registro_ponto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status_localizacao: 'fora' }),
        }),
      );
    });

    it('rejeita registradoEm no futuro', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      const futuro = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      await expect(
        service.registrar(1, { ...dadosBase, registradoEm: futuro }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(prisma.registro_ponto.create).not.toHaveBeenCalled();
    });

    it('rejeita registradoEm antigo demais, fechando a brecha de forjar alocação encerrada', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      const antigo = new Date('2025-06-15T08:00:00.000Z').toISOString();

      await expect(
        service.registrar(1, { ...dadosBase, registradoEm: antigo }),
      ).rejects.toThrow(UnprocessableEntityException);
      // nem chega a consultar alocacao: a data e barrada antes
      expect(prisma.alocacao.findFirst).not.toHaveBeenCalled();
    });

    it('aceita registradoEm retroativo dentro da janela de sync offline', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue(null);
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.registro_ponto.create.mockResolvedValue({
        id: 1,
        tipo: 'entrada',
        registrado_em: new Date(),
        status_localizacao: 'dentro',
        distancia_contrato_m: '5.00',
      });
      prisma.turno.create.mockResolvedValue({ id: 42 });

      const seisHorasAtras = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const resultado = await service.registrar(1, {
        ...dadosBase,
        registradoEm: seisHorasAtras,
      });

      expect(resultado.criado).toBe(true);
      expect(prisma.registro_ponto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ origem: 'offline_sync' }),
        }),
      );
    });

    it('lança 422 quando a saída é anterior à entrada do turno aberto', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.turno.findFirst.mockResolvedValue({
        id: 42,
        contrato_id: 1,
        // turno foi aberto no futuro (relativo ao registradoEm da saída),
        // o que so aconteceria com corrupção de dado ou clock skew — mas
        // precisa dar 422 explicito, não vazar o 500 cru da constraint
        // turno_periodo_valido do banco
        iniciado_em: new Date(Date.now() + 60_000),
      });

      await expect(
        service.registrar(1, { ...dadosBase, tipo: 'saida' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('permite fechar o turno na saída mesmo com a alocação já encerrada (foi válida quando o turno abriu)', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.turno.findFirst.mockResolvedValue({ id: 42, contrato_id: 1 });
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.registro_ponto.create.mockResolvedValue({
        id: 2,
        tipo: 'saida',
        registrado_em: new Date(),
        status_localizacao: 'dentro',
        distancia_contrato_m: '5.00',
      });
      prisma.turno.updateMany.mockResolvedValue({ count: 1 });

      const resultado = await service.registrar(1, { ...dadosBase, tipo: 'saida' });

      expect(prisma.alocacao.findFirst).not.toHaveBeenCalled();
      expect(resultado.dto.turnoId).toBe(42);
    });

    it('fecha o turno na saída, preenchendo registro_ponto_saida_id e encerrado_em', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue({ id: 42, contrato_id: 1 });
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.registro_ponto.create.mockResolvedValue({
        id: 2,
        tipo: 'saida',
        registrado_em: new Date(),
        status_localizacao: 'dentro',
        distancia_contrato_m: '5.00',
      });
      prisma.turno.updateMany.mockResolvedValue({ count: 1 });

      const resultado = await service.registrar(1, { ...dadosBase, tipo: 'saida' });

      // guarda otimista: so fecha se ninguem fechou entre a leitura do
      // turnoAberto e esse update (ver teste de corrida abaixo)
      expect(prisma.turno.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 42, registro_ponto_saida_id: null },
          data: expect.objectContaining({ registro_ponto_saida_id: 2, status: 'no_horario' }),
        }),
      );
      expect(resultado.dto.turnoId).toBe(42);
    });

    it('lança 409 quando duas saídas concorrentes disputam o mesmo turno (a segunda perde a corrida)', async () => {
      prisma.registro_ponto.findUnique.mockResolvedValue(null);
      prisma.alocacao.findFirst.mockResolvedValue({ id: 1 });
      prisma.turno.findFirst.mockResolvedValue({ id: 42, contrato_id: 1 });
      prisma.local_ponto.findMany.mockResolvedValue([local500]);
      prisma.registro_ponto.create.mockResolvedValue({
        id: 2,
        tipo: 'saida',
        registrado_em: new Date(),
        status_localizacao: 'dentro',
        distancia_contrato_m: '5.00',
      });
      // outra requisição ja fechou o turno entre a leitura do turnoAberto e
      // esse update: o guarda "registro_ponto_saida_id: null" no where não
      // bate em nenhuma linha
      prisma.turno.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.registrar(1, { ...dadosBase, tipo: 'saida' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('buscarTurnoAberto', () => {
    it('devolve null quando o vínculo não tem turno aberto', async () => {
      prisma.turno.findFirst.mockResolvedValue(null);
      expect(await service.buscarTurnoAberto(1)).toBeNull();
    });

    it('devolve o turno aberto com o nome do contrato', async () => {
      const iniciadoEm = new Date('2026-08-06T11:00:00Z');
      prisma.turno.findFirst.mockResolvedValue({
        id: 42,
        contrato_id: 3,
        iniciado_em: iniciadoEm,
        contrato: { nome: 'Contrato Teste A' },
      });

      const turno = await service.buscarTurnoAberto(1);

      expect(turno).toEqual({
        id: 42,
        contratoId: 3,
        contratoNome: 'Contrato Teste A',
        iniciadoEm,
      });
    });

    it('busca apenas turno sem saída, escopado no vínculo logado', async () => {
      prisma.turno.findFirst.mockResolvedValue(null);
      await service.buscarTurnoAberto(7);

      expect(prisma.turno.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vinculo_cooperativa_id: 7, registro_ponto_saida_id: null },
        }),
      );
    });
  });

  describe('listarContratosDisponiveis', () => {
    it('mapeia as alocações ativas com seus locais de ponto', async () => {
      prisma.alocacao.findMany.mockResolvedValue([
        {
          contrato: {
            id: 1,
            nome: 'Contrato Teste A',
            codigo: 'TESTE-A',
            local_ponto: [local500],
          },
        },
      ]);

      const resultado = await service.listarContratosDisponiveis(1);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].codigo).toBe('TESTE-A');
      expect(resultado[0].locais).toHaveLength(1);
      expect(resultado[0].locais[0].raioM).toBe(500);
    });

    it('devolve lista vazia quando não há alocação ativa', async () => {
      prisma.alocacao.findMany.mockResolvedValue([]);
      const resultado = await service.listarContratosDisponiveis(1);
      expect(resultado).toEqual([]);
    });
  });
});
