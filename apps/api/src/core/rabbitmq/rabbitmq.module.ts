import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitmqPublisherService } from './rabbitmq-publisher.service';
import { FILA_GEOCODING, FILA_SCORING } from './rabbitmq.constants';

function opcoesFila(fila: string) {
  return {
    transport: Transport.RMQ as const,
    options: {
      urls: [process.env['RABBITMQ_URL'] as string],
      queue: fila,
      queueOptions: { durable: true },
    },
  };
}

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      { name: FILA_SCORING, useFactory: () => opcoesFila(FILA_SCORING) },
      { name: FILA_GEOCODING, useFactory: () => opcoesFila(FILA_GEOCODING) },
    ]),
  ],
  providers: [RabbitmqPublisherService],
  exports: [RabbitmqPublisherService],
})
export class RabbitmqModule {}
