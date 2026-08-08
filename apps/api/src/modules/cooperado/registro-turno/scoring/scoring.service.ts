import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { distanciaMetros } from '../../../../common/geo';
import {
  PRECISAO_MAXIMA_AVALIAVEL_M,
  VELOCIDADE_MAXIMA_PLAUSIVEL_KMH,
} from '../registro-turno.constants';

const LOTE = 20;

interface RegistroParaScoring {
  id: number;
  vinculo_cooperativa_id: number;
  registrado_em: Date;
  latitude: unknown;
  longitude: unknown;
  precisao_m: unknown;
  status_localizacao: string | null;
  origem: string;
}

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  // caminho rapido: chamado pelo consumidor RabbitMQ pra 1 registro so
  async processarUm(registroPontoId: number): Promise<void> {
    const registro = await this.prisma.registro_ponto.findUnique({
      where: { id: registroPontoId },
    });
    // ja processado ou nao existe mais: idempotente, nao reprocessa
    if (!registro || registro.score_calculado_em !== null) return;

    await this.processarRegistro(registro);
  }

  // rede de seguranca: pega o que se perder no RabbitMQ (mensagem nao
  // publicada, fila fora do ar, etc). 5 em 5 min, nao precisa ser rapido
  @Cron('*/5 * * * *')
  async processarPendentes(): Promise<void> {
    const pendentes = await this.prisma.registro_ponto.findMany({
      where: { score_calculado_em: null },
      take: LOTE,
      orderBy: { id: 'asc' },
    });

    for (const registro of pendentes) {
      await this.processarRegistro(registro);
    }
  }

  private async processarRegistro(registro: RegistroParaScoring): Promise<void> {
    // reivindica via score_calculado_em (score_fraude tem CHECK 0-100, nao da
    // pra usar sentinela nele). se outra instancia ja reivindicou, count vem 0
    const reivindicado = await this.prisma.registro_ponto.updateMany({
      where: { id: registro.id, score_calculado_em: null },
      data: { score_calculado_em: new Date() },
    });
    if (reivindicado.count === 0) return;

    try {
      const score = await this.calcularScore(registro);
      await this.prisma.registro_ponto.update({
        where: { id: registro.id },
        data: { score_fraude: score, score_calculado_em: new Date() },
      });
    } catch (erro) {
      this.logger.warn(
        `Falha ao calcular/gravar score do registro ${registro.id}: ${(erro as Error).message}`,
      );
      // libera a reivindicacao pra tentar de novo no proximo tick
      await this.prisma.registro_ponto
        .update({ where: { id: registro.id }, data: { score_calculado_em: null } })
        .catch((erroLiberar: Error) =>
          this.logger.warn(`Falha ao liberar reivindicação do registro ${registro.id}: ${erroLiberar.message}`),
        );
    }
  }

  private async calcularScore(registro: RegistroParaScoring): Promise<number> {
    let score = 0;

    if (registro.status_localizacao === 'fora') score += 40;
    if (Number(registro.precisao_m) > PRECISAO_MAXIMA_AVALIAVEL_M) score += 20;
    if (registro.origem === 'offline_sync') score += 15;

    const anterior = await this.prisma.registro_ponto.findFirst({
      where: {
        vinculo_cooperativa_id: registro.vinculo_cooperativa_id,
        id: { not: registro.id },
        registrado_em: { lt: registro.registrado_em },
      },
      orderBy: { registrado_em: 'desc' },
    });

    if (anterior) {
      const distancia = distanciaMetros(
        Number(registro.latitude),
        Number(registro.longitude),
        Number(anterior.latitude),
        Number(anterior.longitude),
      );

      if (distancia === 0) {
        // coordenada identica a anterior, indicio de local fixo/spoofing
        score += 15;
      } else {
        const horas =
          (registro.registrado_em.getTime() - anterior.registrado_em.getTime()) /
          1000 /
          3600;
        const velocidadeKmh = horas > 0 ? distancia / 1000 / horas : Infinity;
        if (velocidadeKmh > VELOCIDADE_MAXIMA_PLAUSIVEL_KMH) score += 30;
      }
    }

    return Math.min(score, 100);
  }
}
