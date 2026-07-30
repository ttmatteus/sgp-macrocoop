import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../modules/auth/auth.module';
import { CooperadoModule } from '../modules/cooperado/cooperado.module';
import { PrismaModule } from '../core/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CooperadoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
