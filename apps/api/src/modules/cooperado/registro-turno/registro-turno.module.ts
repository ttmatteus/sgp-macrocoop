import { Module } from '@nestjs/common';
import { RegistroTurnoController } from './registro-turno.controller';
import { RegistroTurnoService } from './registro-turno.service';
import { ScoringService } from './scoring/scoring.service';

@Module({
  controllers: [RegistroTurnoController],
  providers: [RegistroTurnoService, ScoringService],
})
export class RegistroTurnoModule {}
