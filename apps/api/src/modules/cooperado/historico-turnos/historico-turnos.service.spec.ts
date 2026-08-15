import { Test, TestingModule } from '@nestjs/testing';
import { HistoricoTurnosService } from './historico-turnos.service';
import { PrismaService } from '../../../core/prisma/prisma.service';

describe('HistoricoTurnosService', () => {
  let service: HistoricoTurnosService;
  let findMany: jest.Mock;
  let count: jest.Mock;

  const turnoDoBanco = {
    id: 7,
    contrato_id: 3,
    contrato: { nome: 'Contrato Teste A' },
    iniciado_em: new Date('2026-06-01T11:00:00.000Z'),
    encerrado_em: new Date('2026-06-01T20:00:00.000Z'),
    status: 'no_horario',
  };

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue([turnoDoBanco]);
    count = jest.fn().mockResolvedValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoricoTurnosService,
        { provide: PrismaService, useValue: { turno: { findMany, count } } },
      ],
    }).compile();

    service = module.get<HistoricoTurnosService>(HistoricoTurnosService);
  });

  it('so traz turno encerrado do vinculo autenticado', async () => {
    await service.listar(42, {});

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          vinculo_cooperativa_id: 42,
          encerrado_em: { not: null },
        }),
      }),
    );
  });

  it('usa pagina 1 e limite 10 por padrao', async () => {
    const resultado = await service.listar(1, {});

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(resultado.pagina).toBe(1);
    expect(resultado.limite).toBe(10);
  });

  it('calcula o skip a partir da pagina', async () => {
    await service.listar(1, { pagina: 3, limite: 5 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
  });

  it('ordena por iniciado_em desc', async () => {
    await service.listar(1, {});

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { iniciado_em: 'desc' } }),
    );
  });

  it('aplica o filtro de contrato quando informado', async () => {
    await service.listar(1, { contratoId: 4 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ contrato_id: 4 }),
      }),
    );
  });

  it('nao filtra contrato quando nao informado', async () => {
    await service.listar(1, {});

    const where = findMany.mock.calls[0][0].where;
    expect(where.contrato_id).toBeUndefined();
  });

  it('recorta o periodo pelas bordas do dia em Sao Paulo', async () => {
    await service.listar(1, { inicio: '2026-06-10', fim: '2026-06-10' });

    const where = findMany.mock.calls[0][0].where;
    // 00h de Sao Paulo, nao 00h UTC: senao um turno iniciado 21h no
    // brasil cairia no dia seguinte do filtro
    expect(where.iniciado_em.gte).toEqual(new Date('2026-06-10T03:00:00.000Z'));
    expect(where.iniciado_em.lt).toEqual(new Date('2026-06-11T03:00:00.000Z'));
  });

  it('inclui um turno noturno no dia civil correto', async () => {
    await service.listar(1, { inicio: '2026-06-10', fim: '2026-06-10' });

    const { gte, lt } = findMany.mock.calls[0][0].where.iniciado_em;
    const turnoNoturno = new Date('2026-06-11T00:30:00.000Z'); // 10/06 21h30 SP

    expect(turnoNoturno >= gte && turnoNoturno < lt).toBe(true);
  });

  it('nao monta filtro de data quando nenhuma data e informada', async () => {
    await service.listar(1, {});

    expect(findMany.mock.calls[0][0].where.iniciado_em).toBeUndefined();
  });

  it('devolve lista vazia com total 0, sem erro, quando nao ha turno', async () => {
    findMany.mockResolvedValue([]);
    count.mockResolvedValue(0);

    const resultado = await service.listar(1, {
      inicio: '2020-01-01',
      fim: '2020-01-31',
    });

    expect(resultado.itens).toEqual([]);
    expect(resultado.total).toBe(0);
  });

  it('mapeia o turno pro formato do dto', async () => {
    const resultado = await service.listar(1, {});

    expect(resultado.itens[0]).toEqual({
      id: 7,
      contratoId: 3,
      contratoNome: 'Contrato Teste A',
      iniciadoEm: turnoDoBanco.iniciado_em,
      encerradoEm: turnoDoBanco.encerrado_em,
      status: 'no_horario',
    });
  });
});
