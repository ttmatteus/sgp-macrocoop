import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HistoricoTurnosQueryDto } from './dto/historico-turnos.dto';
import type { HistoricoTurnosDto } from './dto/historico-turnos.dto';
import { JwtAuthGuard } from '../../../core/auth/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/current-user.decorator';
import type { CurrentUserPayload } from '../../../core/auth/current-user.interface';

@Controller('turnos')
export class HistoricoTurnosController {
  @UseGuards(JwtAuthGuard)
  @Get('historico')
  async listar(
    @CurrentUser() user: CurrentUserPayload,
    @Query() filtros: HistoricoTurnosQueryDto,
  ): Promise<HistoricoTurnosDto> {
    throw new Error('Nao implementado');
  }
}
