import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { MapsApiService } from './maps-api.service';

const LOTE = 20;

interface RegistroParaGeocoding {
  id: number;
  latitude: unknown;
  longitude: unknown;
}

@Injectable()
export class GeocodificacaoService {
  private readonly logger = new Logger(GeocodificacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapsApi: MapsApiService,
  ) {}

  // caminho rapido: chamado pelo consumidor RabbitMQ pra 1 registro so
  async processarUm(registroPontoId: number): Promise<void> {
    const registro = await this.prisma.registro_ponto.findUnique({
      where: { id: registroPontoId },
    });
    // ja processado ou nao existe mais: idempotente, nao reprocessa
    if (!registro || registro.endereco_reverso !== null) return;

    await this.processarRegistro(registro);
  }

  // rede de seguranca: pega o que se perder no RabbitMQ (mensagem nao
  // publicada, fila fora do ar, etc). 5 em 5 min, nao precisa ser rapido
  @Cron('*/5 * * * *')
  async processarPendentes(): Promise<void> {
    const pendentes = await this.prisma.registro_ponto.findMany({
      where: { endereco_reverso: null },
      take: LOTE,
      orderBy: { id: 'asc' },
    });

    for (const registro of pendentes) {
      await this.processarRegistro(registro);
    }
  }

  private async processarRegistro(registro: RegistroParaGeocoding): Promise<void> {
    const endereco = await this.mapsApi.buscarEnderecoReverso(
      Number(registro.latitude),
      Number(registro.longitude),
    );
    if (!endereco) return;

    await this.prisma.registro_ponto
      .update({ where: { id: registro.id }, data: { endereco_reverso: endereco } })
      .catch((erro: Error) =>
        this.logger.warn(`Falha ao gravar endereco do registro ${registro.id}: ${erro.message}`),
      );
  }
}
