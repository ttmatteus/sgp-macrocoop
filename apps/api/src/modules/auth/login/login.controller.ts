import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUserPayload } from '../../../core/auth/current-user.interface';
import { LoginDto } from './dto/login.dto';
import { LoginService } from './login.service';

@Controller('login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Omit<CurrentUserPayload, 'jti'>> {
    const { token, user } = await this.loginService.login(dto);

    res.set('Cache-Control', 'no-store');
    // mudei de sameSite lax (era o que o card pedia) pra none pq web e api sao dominios
    // diferentes de vdd em prod (vercel vs cloud run), e lax n manda cookie em fetch cross-site.
    // secure exige https, então em http puro o navegador pode n salvar o cookie
    res.cookie('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 3600 * 1000,
    });

    return user;
  }
}
