import { Controller, Get, UseGuards } from '@nestjs/common';
import { PerfilService } from './perfil.service';
import { PerfilDto } from './dto/perfil.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CurrentUserPayload } from '../../auth/types/current-user-payload.type';

@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async obterPerfil(@CurrentUser() user: CurrentUserPayload): Promise<PerfilDto> {
    return this.perfilService.buscarPerfilDoCooperado(user.vinculoId);
  }
}