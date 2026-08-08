import { Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../core/auth/jwt-auth.guard';

// opcional, caso queira testar o job sem esperar o cron do 5o dia util
@Controller('folha-producao/fechamento')
export class FechamentoController {
  @UseGuards(JwtAuthGuard)
  @Post(':ano/:mes')
  async dispararFechamento(
    @Param('ano', ParseIntPipe) ano: number,
    @Param('mes', ParseIntPipe) mes: number,
  ): Promise<void> {
    throw new Error('Nao implementado');
  }
}
