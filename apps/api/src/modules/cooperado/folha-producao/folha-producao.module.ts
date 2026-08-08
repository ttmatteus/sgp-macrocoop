import { Module } from '@nestjs/common';
import { FechamentoModule } from './fechamento/fechamento.module';
import { ConsultaModule } from './consulta/consulta.module';

@Module({
  imports: [FechamentoModule, ConsultaModule],
})
export class FolhaProducaoModule {}
