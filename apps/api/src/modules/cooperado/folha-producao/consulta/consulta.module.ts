import { Module } from '@nestjs/common';
import { ConsultaController } from './consulta.controller';
import { ConsultaService } from './consulta.service';

@Module({
  controllers: [ConsultaController],
  providers: [ConsultaService],
})
export class ConsultaModule {}
