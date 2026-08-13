import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Holidays from 'date-holidays';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../../core/prisma/prisma.service';

const RSR_PERCENTUAL = new Prisma.Decimal('0.1922');

type Competencia = {
  ano: number;
  mes: number;
};

@Injectable()
export class FechamentoService {
  private readonly logger = new Logger(FechamentoService.name);
  private readonly feriados = new Holidays('BR');

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 3 * * *', { timeZone: 'America/Sao_Paulo' })
  async executarFechamentoAgendado(): Promise<void> {
    const hoje = new Date();
    if (!this.hojeEhOQuintoDiaUtil(hoje)) return;

    const competencia = this.obterCompetenciaAnterior(hoje);
    await this.fecharCompetencia(competencia.ano, competencia.mes);
  }

  hojeEhOQuintoDiaUtil(data: Date = new Date()): boolean {
    const { ano, mes, dia } = this.obterDataEmSaoPaulo(data);
    let diasUteis = 0;

    for (let diaDoMes = 1; diaDoMes <= dia; diaDoMes += 1) {
      if (!this.ehDiaUtil(new Date(Date.UTC(ano, mes - 1, diaDoMes, 12)))) {
        continue;
      }

      diasUteis += 1;
    }

    return diasUteis === 5;
  }

  async fecharCompetencia(ano: number, mes: number): Promise<void> {
    const { inicio, fim } = this.obterPeriodoDaCompetencia(ano, mes);
    const vinculos = await this.prisma.turno.findMany({
      where: {
        iniciado_em: { gte: inicio, lt: fim },
        encerrado_em: { not: null },
      },
      distinct: ['vinculo_cooperativa_id'],
      select: { vinculo_cooperativa_id: true },
    });

    for (const { vinculo_cooperativa_id: vinculoId } of vinculos) {
      try {
        await this.calcularVinculo(vinculoId, ano, mes);
      } catch (erro) {
        this.logger.error(
          `Falha ao fechar a competência ${ano}-${String(mes).padStart(2, '0')} do vínculo ${vinculoId}.`,
          erro instanceof Error ? erro.stack : undefined,
        );
      }
    }
  }

  async calcularVinculo(vinculoId: number, ano: number, mes: number): Promise<void> {
    const { inicio, fim } = this.obterPeriodoDaCompetencia(ano, mes);
    const [vinculo, turnos] = await Promise.all([
      this.prisma.vinculo_cooperativa.findUniqueOrThrow({
        where: { id: vinculoId },
        select: { cooperativa_id: true, data_desligamento: true },
      }),
      this.prisma.turno.findMany({
        where: {
          vinculo_cooperativa_id: vinculoId,
          iniciado_em: { gte: inicio, lt: fim },
          encerrado_em: { not: null },
        },
        select: { iniciado_em: true, encerrado_em: true },
      }),
    ]);

    if (turnos.length === 0) return;

    const fimDoPeriodoAtivo = vinculo.data_desligamento
      ? this.inicioDoDiaSeguinte(vinculo.data_desligamento)
      : fim;
    const turnosDoPeriodoAtivo = turnos.filter(
      (turno) => turno.iniciado_em < fimDoPeriodoAtivo,
    );

    if (turnosDoPeriodoAtivo.length === 0) return;

    const producaoBase = this.calcularProducaoBase();
    if (!producaoBase) {
      this.logger.warn(
        `Competência ${ano}-${String(mes).padStart(2, '0')} do vínculo ${vinculoId} não foi materializada porque não há valor de turno configurado.`,
      );
      return;
    }

    const proporcaoAtiva = this.obterProporcaoAtiva(
      inicio,
      fim,
      vinculo.data_desligamento,
    );
    const rsr = this.arredondarMoeda(
      producaoBase.mul(RSR_PERCENTUAL).mul(proporcaoAtiva),
    );
    const adicionais = new Prisma.Decimal(0);
    const bruto = producaoBase.plus(rsr).plus(adicionais);
    const competencia = new Date(Date.UTC(ano, mes - 1, 1, 12));
    const inssDesconto = await this.calcularInss(bruto, competencia);
    const irrfDesconto = await this.calcularIrrf(bruto.minus(inssDesconto), competencia);
    const total = this.arredondarMoeda(bruto.minus(inssDesconto).minus(irrfDesconto));

    await this.gravar({
      vinculoId,
      cooperativaId: vinculo.cooperativa_id,
      ano,
      mes,
      producaoBase,
      rsr,
      adicionais,
      inssDesconto,
      irrfDesconto,
      total,
    });
  }

  async calcularInss(
    base: Prisma.Decimal,
    competencia: Date,
  ): Promise<Prisma.Decimal> {
    const faixas = await this.prisma.faixa_inss.findMany({
      where: {
        vigencia_inicio: { lte: competencia },
        OR: [{ vigencia_fim: null }, { vigencia_fim: { gte: competencia } }],
      },
      orderBy: { valor_minimo: 'asc' },
    });

    const desconto = faixas.reduce((acumulado, faixa) => {
      if (base.lte(faixa.valor_minimo)) return acumulado;

      const limiteDaFaixa = faixa.valor_maximo ?? base;
      const parcela = Prisma.Decimal.min(base, limiteDaFaixa).minus(faixa.valor_minimo);
      return acumulado.plus(parcela.mul(faixa.aliquota));
    }, new Prisma.Decimal(0));

    return this.arredondarMoeda(desconto);
  }

  async calcularIrrf(
    base: Prisma.Decimal,
    competencia: Date,
  ): Promise<Prisma.Decimal> {
    const faixa = await this.prisma.faixa_irrf.findFirst({
      where: {
        vigencia_inicio: { lte: competencia },
        valor_minimo: { lte: base },
        AND: [
          {
            OR: [
              { vigencia_fim: null },
              { vigencia_fim: { gte: competencia } },
            ],
          },
          {
            OR: [
              { valor_maximo: null },
              { valor_maximo: { gte: base } },
            ],
          },
        ],
      },
      orderBy: { valor_minimo: 'desc' },
    });

    if (!faixa) return new Prisma.Decimal(0);

    return this.arredondarMoeda(Prisma.Decimal.max(
      new Prisma.Decimal(0),
      base.mul(faixa.aliquota).minus(faixa.deducao),
    ));
  }

  private ehDiaUtil(data: Date): boolean {
    const diaDaSemana = data.getUTCDay();
    return diaDaSemana !== 0 && diaDaSemana !== 6 && !this.feriados.isHoliday(data);
  }

  private obterCompetenciaAnterior(data: Date): Competencia {
    const { ano, mes } = this.obterDataEmSaoPaulo(data);
    return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
  }

  private obterDataEmSaoPaulo(data: Date): { ano: number; mes: number; dia: number } {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(data);

    return {
      ano: Number(partes.find((parte) => parte.type === 'year')?.value),
      mes: Number(partes.find((parte) => parte.type === 'month')?.value),
      dia: Number(partes.find((parte) => parte.type === 'day')?.value),
    };
  }

  private obterPeriodoDaCompetencia(ano: number, mes: number): { inicio: Date; fim: Date } {
    return {
      inicio: new Date(Date.UTC(ano, mes - 1, 1)),
      fim: new Date(Date.UTC(ano, mes, 1)),
    };
  }

  private inicioDoDiaSeguinte(data: Date): Date {
    return new Date(
      Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate() + 1),
    );
  }

  private obterProporcaoAtiva(
    inicio: Date,
    fim: Date,
    dataDesligamento: Date | null,
  ): Prisma.Decimal {
    if (!dataDesligamento || dataDesligamento >= fim) return new Prisma.Decimal(1);

    const diasDoMes = (fim.getTime() - inicio.getTime()) / 86_400_000;
    const fimAtivo = this.inicioDoDiaSeguinte(dataDesligamento);
    const diasAtivos = Math.max(
      0,
      Math.min(fimAtivo.getTime(), fim.getTime()) - inicio.getTime(),
    ) / 86_400_000;

    return new Prisma.Decimal(diasAtivos).div(diasDoMes);
  }

  private calcularProducaoBase(): Prisma.Decimal | null {
    return null;
  }

  private arredondarMoeda(valor: Prisma.Decimal): Prisma.Decimal {
    return valor.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }

  private async gravar(dados: {
    vinculoId: number;
    cooperativaId: number;
    ano: number;
    mes: number;
    producaoBase: Prisma.Decimal;
    rsr: Prisma.Decimal;
    adicionais: Prisma.Decimal;
    inssDesconto: Prisma.Decimal;
    irrfDesconto: Prisma.Decimal;
    total: Prisma.Decimal;
  }): Promise<void> {
    await this.prisma.folha_producao.upsert({
      where: {
        vinculo_cooperativa_id_ano_mes: {
          vinculo_cooperativa_id: dados.vinculoId,
          ano: dados.ano,
          mes: dados.mes,
        },
      },
      create: {
        vinculo_cooperativa_id: dados.vinculoId,
        cooperativa_id: dados.cooperativaId,
        ano: dados.ano,
        mes: dados.mes,
        producao_base: dados.producaoBase,
        rsr: dados.rsr,
        rsr_percentual: RSR_PERCENTUAL,
        adicionais: dados.adicionais,
        inss_desconto: dados.inssDesconto,
        irrf_desconto: dados.irrfDesconto,
        total: dados.total,
      },
      update: {
        producao_base: dados.producaoBase,
        rsr: dados.rsr,
        rsr_percentual: RSR_PERCENTUAL,
        adicionais: dados.adicionais,
        inss_desconto: dados.inssDesconto,
        irrf_desconto: dados.irrfDesconto,
        total: dados.total,
        fechada_em: new Date(),
      },
    });
  }
}
