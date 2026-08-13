import { Module } from '@nestjs/common';
import { FechamentoService } from './fechamento.service';

@Module({
  providers: [FechamentoService],
  exports: [FechamentoService],
})
export class FechamentoModule {}
