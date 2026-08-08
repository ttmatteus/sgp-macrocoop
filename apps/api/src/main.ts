import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';
import { FILA_GEOCODING, FILA_SCORING } from './core/rabbitmq/rabbitmq.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // um connectMicroservice por fila: cada uma e uma conexao/consumidor
  // separado, sem isso os @EventPattern(FILA_*) nunca recebem mensagem
  for (const fila of [FILA_SCORING, FILA_GEOCODING]) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [process.env['RABBITMQ_URL'] as string],
        queue: fila,
        queueOptions: { durable: true },
      },
    });
  }

  app
    .getHttpAdapter()
    .getInstance()
    .set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
  // localhost/ip de rede local com qualquer porta, pra dar pra testar de celular na mesma rede.
  // isso so faz sentido em dev, entao fica de fora do build de producao
  const origensRedeLocal = [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
  ];

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://sgp-macrocoop.vercel.app']
        : [...origensRedeLocal, 'https://sgp-macrocoop.vercel.app'],
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );

  // sem await: retry do RMQ e infinito, se o broker cair a API travava
  // pra sempre no bootstrap. conecta em background
  app.startAllMicroservices().catch((erro: unknown) =>
    Logger.error('Falha ao conectar nas filas do RabbitMQ', erro as Error),
  );
}

bootstrap();
