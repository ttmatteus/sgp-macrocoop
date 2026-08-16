import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { SessoesService } from './sessoes.service';
import { RevogarSessaoDto, type SessaoDto } from './dto/sessoes.dto';
import { JwtAuthGuard } from '../../../core/auth/jwt-auth.guard';
import { CurrentUser } from '../../../core/auth/current-user.decorator';
import type { CurrentUserPayload } from '../../../core/auth/current-user.interface';

@Controller('sessoes')
export class SessoesController {
  constructor(private readonly sessoesService: SessoesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async listar(@CurrentUser() user: CurrentUserPayload): Promise<SessaoDto[]> {
    return this.sessoesService.listar(user.vinculoId, user.jti);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async revogarTodas(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RevogarSessaoDto,
  ): Promise<void> {
    await this.sessoesService.revogarTodas(user.vinculoId, dto.senha);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':jti')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revogar(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jti') jti: string,
    @Body() dto: RevogarSessaoDto,
  ): Promise<void> {
    await this.sessoesService.revogar(user.vinculoId, jti, dto.senha);
  }
}
