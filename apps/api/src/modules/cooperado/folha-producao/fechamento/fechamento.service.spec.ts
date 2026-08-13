import { Logger } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { FechamentoService } from './fechamento.service';

const decimal = (valor: string | number) => new Prisma.Decimal(valor);

describe('FechamentoService', () => {
  const prisma = {
    folha_producao: { upsert: jest.fn() },
    turno: { findMany: jest.fn() },
    faixa_inss: { findMany: jest.fn() },
    faixa_irrf: { findFirst: jest.fn() },
    vinculo_cooperativa: { findUniqueOrThrow: jest.fn() },
  };
  let service: FechamentoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FechamentoService(prisma as unknown as PrismaService);
  });

  it('identifica o quinto dia útil após feriado nacional', () => {
    expect(service.hojeEhOQuintoDiaUtil(new Date('2026-01-08T12:00:00.000Z'))).toBe(true);
    expect(service.hojeEhOQuintoDiaUtil(new Date('2026-01-07T12:00:00.000Z'))).toBe(false);
  });

  it('calcula INSS progressivo até o teto', async () => {
    prisma.faixa_inss.findMany.mockResolvedValue([
      { valor_minimo: decimal(0), valor_maximo: decimal(1412), aliquota: decimal('0.075') },
      { valor_minimo: decimal(1412), valor_maximo: decimal('2666.68'), aliquota: decimal('0.09') },
      { valor_minimo: decimal('2666.68'), valor_maximo: decimal('4000.03'), aliquota: decimal('0.12') },
      { valor_minimo: decimal('4000.03'), valor_maximo: decimal('7786.02'), aliquota: decimal('0.14') },
    ]);

    const desconto = await service.calcularInss(
      decimal(8000),
      new Date('2026-01-01T12:00:00.000Z'),
    );

    expect(desconto.toFixed(2)).toBe('908.86');
  });

  it('calcula IRRF pela faixa e não devolve valor negativo', async () => {
    prisma.faixa_irrf.findFirst
      .mockResolvedValueOnce({ aliquota: decimal('0.15'), deducao: decimal('381.44') })
      .mockResolvedValueOnce({ aliquota: decimal('0.075'), deducao: decimal('169.44') });

    const desconto = await service.calcularIrrf(
      decimal(3000),
      new Date('2026-01-01T12:00:00.000Z'),
    );
    const isento = await service.calcularIrrf(
      decimal(2000),
      new Date('2026-01-01T12:00:00.000Z'),
    );

    expect(desconto.toFixed(2)).toBe('68.56');
    expect(isento.toFixed(2)).toBe('0.00');
  });

  it('continua o fechamento quando um vínculo falha', async () => {
    prisma.turno.findMany.mockResolvedValue([
      { vinculo_cooperativa_id: 1 },
      { vinculo_cooperativa_id: 2 },
    ]);
    const calcularVinculo = jest
      .spyOn(service, 'calcularVinculo')
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValueOnce(undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    await expect(service.fecharCompetencia(2026, 6)).resolves.toBeUndefined();

    expect(calcularVinculo).toHaveBeenCalledTimes(2);
    expect(calcularVinculo).toHaveBeenNthCalledWith(1, 1, 2026, 6);
    expect(calcularVinculo).toHaveBeenNthCalledWith(2, 2, 2026, 6);
  });

  it('não materializa uma folha sem uma fonte de valor por turno', async () => {
    prisma.vinculo_cooperativa.findUniqueOrThrow.mockResolvedValue({
      cooperativa_id: 1,
      data_desligamento: null,
    });
    prisma.turno.findMany.mockResolvedValue([
      {
        iniciado_em: new Date('2026-06-01T12:00:00.000Z'),
        encerrado_em: new Date('2026-06-01T20:00:00.000Z'),
      },
    ]);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await service.calcularVinculo(1, 2026, 6);

    expect(prisma.folha_producao.upsert).not.toHaveBeenCalled();
    expect(Logger.prototype.warn).toHaveBeenCalledTimes(1);
  });
});
