import { Controller, Get, UseGuards } from '@nestjs/common';
import { PerfilService } from './perfil.service';
import type { PerfilDto } from './dto/perfil.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { CurrentUser } from '../../core/auth/current-user.decorator';
import type { CurrentUserPayload } from '../../core/auth/current-user.interface';

@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async obterPerfil(@CurrentUser() user: CurrentUserPayload): Promise<PerfilDto> {
    return this.perfilService.buscarPerfilDoCooperado(user.vinculoId);
  }
}