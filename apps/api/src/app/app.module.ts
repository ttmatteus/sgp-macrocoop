import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../modules/auth/auth.module';
import { CooperadoModule } from '../modules/cooperado/cooperado.module';
import { PrismaModule } from '../core/prisma/prisma.module';
import { RedisModule } from '../core/redis/redis.module';
import { AuthCoreModule } from '../core/auth/auth-core.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthCoreModule,
    AuthModule,
    CooperadoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
