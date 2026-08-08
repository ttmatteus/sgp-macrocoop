import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { FILA_GEOCODING, FILA_SCORING } from './rabbitmq.constants';

@Injectable()
export class RabbitmqPublisherService {
  private readonly logger = new Logger(RabbitmqPublisherService.name);

  constructor(
    @Inject(FILA_SCORING) private readonly scoringClient: ClientProxy,
    @Inject(FILA_GEOCODING) private readonly geocodingClient: ClientProxy,
  ) {}

  // nunca lanca: falha de publish nao pode derrubar o POST /registro. o cron
  // sweep de cada consumidor (agora so rede de seguranca) cobre o que se perder aqui
  async publicarPontoRegistrado(registroPontoId: number): Promise<void> {
    const payload = { registroPontoId };

    const resultados = await Promise.allSettled([
      firstValueFrom(this.scoringClient.emit(FILA_SCORING, payload)),
      firstValueFrom(this.geocodingClient.emit(FILA_GEOCODING, payload)),
    ]);

    const filas = [FILA_SCORING, FILA_GEOCODING];
    resultados.forEach((resultado, i) => {
      if (resultado.status === 'rejected') {
        this.logger.warn(
          `Falha ao publicar em ${filas[i]} pro registro ${registroPontoId}: ${resultado.reason}`,
        );
      }
    });
  }
}
