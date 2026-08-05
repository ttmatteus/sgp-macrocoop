import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
} from '@nestjs/common';
import {
  RecuperarSenhaDto,
  RedefinirSenhaDto,
  RedefinirSenhaTokenParamsDto,
} from './dto/recuperar-senha.dto';
import { RecuperarSenhaService } from './recuperar-senha.service';

@Controller()
export class RecuperarSenhaController {
  constructor(private readonly recuperarSenhaService: RecuperarSenhaService) {}

  @Post('recuperar-senha')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  solicitar(@Body() dto: RecuperarSenhaDto, @Ip() ip: string) {
    if (dto.usuario && dto.email) {
      throw new BadRequestException('Informe apenas usuário ou e-mail.');
    }

    if (dto.email) {
      return this.recuperarSenhaService.solicitarPorEmail(dto.email, ip);
    }

    if (!dto.usuario) {
      throw new BadRequestException('Informe usuário ou e-mail.');
    }

    return this.recuperarSenhaService.solicitarPorUsuario(dto.usuario, ip);
  }

  @Get('redefinir-senha/:token')
  @Header('Cache-Control', 'no-store')
  consultarToken(@Param() params: RedefinirSenhaTokenParamsDto) {
    return this.recuperarSenhaService.consultarToken(params.token);
  }

  @Post('redefinir-senha')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  redefinir(@Body() dto: RedefinirSenhaDto) {
    return this.recuperarSenhaService.redefinir(dto.token, dto.senha);
  }
}
