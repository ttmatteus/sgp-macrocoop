import { Module } from '@nestjs/common';
import { FechamentoController } from './fechamento.controller';
import { FechamentoService } from './fechamento.service';

@Module({
  controllers: [FechamentoController],
  providers: [FechamentoService],
  exports: [FechamentoService],
})
export class FechamentoModule {}
