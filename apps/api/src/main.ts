/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
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
}

bootstrap();
