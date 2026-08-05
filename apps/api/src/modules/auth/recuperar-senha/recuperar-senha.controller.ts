import {
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
  RecuperarSenhaEmailParamsDto,
  RedefinirSenhaDto,
  RedefinirSenhaTokenParamsDto,
} from './dto/recuperar-senha.dto';
import { RecuperarSenhaService } from './recuperar-senha.service';

@Controller()
export class RecuperarSenhaController {
  constructor(private readonly recuperarSenhaService: RecuperarSenhaService) {}

  @Post('recupera-senha')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  solicitarPorUsuario(@Body() dto: RecuperarSenhaDto, @Ip() ip: string) {
    return this.recuperarSenhaService.solicitarPorUsuario(dto.usuario, ip);
  }

  @Post('recupera-senha/:email')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  solicitarPorEmail(
    @Param() params: RecuperarSenhaEmailParamsDto,
    @Ip() ip: string,
  ) {
    return this.recuperarSenhaService.solicitarPorEmail(params.email, ip);
  }

  @Get('redefinir-senha/:token')
  @Header('Cache-Control', 'no-store')
  consultarToken(@Param() params: RedefinirSenhaTokenParamsDto) {
    return this.recuperarSenhaService.consultarToken(params.token);
  }

  @Post('redefinir-senha')
  @HttpCode(HttpStatus.OK)
  redefinir(@Body() dto: RedefinirSenhaDto) {
    return this.recuperarSenhaService.redefinir(dto.token, dto.senha);
  }
}
