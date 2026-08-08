import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import type {
  FolhaProducaoDto,
  FolhaMensagensDto,
  ProducaoParcialDto,
} from './dto/folha-producao.dto';
import { JwtAuthGuard } from '../../../../core/auth/jwt-auth.guard';
import { CurrentUser } from '../../../../core/auth/current-user.decorator';
import type { CurrentUserPayload } from '../../../../core/auth/current-user.interface';

@Controller('folha-producao')
export class ConsultaController {
  @UseGuards(JwtAuthGuard)
  @Get('parcial')
  async obterParcial(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ProducaoParcialDto> {
    throw new Error('Nao implementado');
  }

  @UseGuards(JwtAuthGuard)
  @Get(':ano/:mes')
  async obterPorCompetencia(
    @CurrentUser() user: CurrentUserPayload,
    @Param('ano', ParseIntPipe) ano: number,
    @Param('mes', ParseIntPipe) mes: number,
  ): Promise<FolhaProducaoDto> {
    throw new Error('Nao implementado');
  }

  @UseGuards(JwtAuthGuard)
  @Get(':ano/:mes/mensagens')
  async obterMensagens(
    @CurrentUser() user: CurrentUserPayload,
    @Param('ano', ParseIntPipe) ano: number,
    @Param('mes', ParseIntPipe) mes: number,
  ): Promise<FolhaMensagensDto> {
    throw new Error('Nao implementado');
  }
}
