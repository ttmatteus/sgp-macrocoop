import { Module } from '@nestjs/common';
import { HistoricoTurnosController } from './historico-turnos.controller';
import { HistoricoTurnosService } from './historico-turnos.service';

@Module({
  controllers: [HistoricoTurnosController],
  providers: [HistoricoTurnosService],
})
export class HistoricoTurnosModule {}
