import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RegistrarPontoDto } from './dto/registro-turno.dto';
import type {
  ContratoDisponivelDto,
  RegistroPontoDto,
} from './dto/registro-turno.dto';
import { JwtAuthGuard } from '../../../core/auth/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/current-user.decorator';
import type { CurrentUserPayload } from '../../../core/auth/current-user.interface';

@Controller('turnos')
export class RegistroTurnoController {
  @UseGuards(JwtAuthGuard)
  @Get('contratos-disponiveis')
  async listarContratosDisponiveis(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ContratoDisponivelDto[]> {
    throw new Error('Nao implementado');
  }

  @UseGuards(JwtAuthGuard)
  @Post('registro')
  async registrar(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dados: RegistrarPontoDto,
  ): Promise<RegistroPontoDto> {
    throw new Error('Nao implementado');
  }
}
