import { Module } from '@nestjs/common';
import { RegistroTurnoController } from './registro-turno.controller';
import { RegistroTurnoService } from './registro-turno.service';
import { ScoringService } from './scoring/scoring.service';
import { ScoringController } from './scoring/scoring.controller';
import { GeocodificacaoService } from './geocodificacao/geocodificacao.service';
import { GeocodificacaoController } from './geocodificacao/geocodificacao.controller';
import { MapsApiService } from './geocodificacao/maps-api.service';

@Module({
  controllers: [RegistroTurnoController, ScoringController, GeocodificacaoController],
  providers: [RegistroTurnoService, ScoringService, GeocodificacaoService, MapsApiService],
})
export class RegistroTurnoModule {}
