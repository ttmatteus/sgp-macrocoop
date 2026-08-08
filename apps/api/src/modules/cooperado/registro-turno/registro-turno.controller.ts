import { Body, Controller, Get, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { RegistroTurnoService } from './registro-turno.service';
import { RegistrarPontoDto } from './dto/registro-turno.dto';
import type {
  ContratoDisponivelDto,
  RegistroPontoDto,
  TurnoAbertoDto,
} from './dto/registro-turno.dto';
import { JwtAuthGuard } from '../../../core/auth/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/current-user.decorator';
import type { CurrentUserPayload } from '../../../core/auth/current-user.interface';

@Controller('turnos')
export class RegistroTurnoController {
  constructor(private readonly registroTurnoService: RegistroTurnoService) {}

  @UseGuards(JwtAuthGuard)
  @Get('contratos-disponiveis')
  async listarContratosDisponiveis(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ContratoDisponivelDto[]> {
    return this.registroTurnoService.listarContratosDisponiveis(user.vinculoId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('aberto')
  async obterTurnoAberto(
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TurnoAbertoDto | undefined> {
    const turno = await this.registroTurnoService.buscarTurnoAberto(user.vinculoId);
    if (!turno) {
      // 204 em vez de 404, nao ter turno aberto e estado normal, nao erro
      res.status(HttpStatus.NO_CONTENT);
      return undefined;
    }
    return turno;
  }

  @UseGuards(JwtAuthGuard)
  @Post('registro')
  async registrar(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dados: RegistrarPontoDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RegistroPontoDto> {
    const { dto, criado } = await this.registroTurnoService.registrar(user.vinculoId, dados);
    res.status(criado ? HttpStatus.CREATED : HttpStatus.OK);
    return dto;
  }
}
