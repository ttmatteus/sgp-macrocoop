import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUserPayload } from '../../../core/auth/current-user.interface';
import { SESSION_TTL_SECONDS } from '../../../core/auth/session.constants';
import { LoginRateLimitInterceptor } from '../../../common/interceptors/login-rate-limit.interceptor';
import { LoginDto } from './dto/login.dto';
import { LoginService } from './login.service';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(LoginRateLimitInterceptor)
  async login(
    @Body() dto: LoginDto,
    // chamada e server-to-server, @Ip()/@Req() pegariam o next, nao o navegador
    @Headers('x-sessao-ip') ip: string | undefined,
    @Headers('x-sessao-user-agent') userAgent: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<CurrentUserPayload, 'jti' | 'iat' | 'exp'>> {
    const { token, user } = await this.loginService.login(dto, {
      ip: ip ?? 'desconhecido',
      userAgent: userAgent ?? 'desconhecido',
    });

    res.set('Cache-Control', 'no-store');
    // o token nunca vai no body, so no Set-Cookie
    res.cookie('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS * 1000,
    });

    return user;
  }
}
