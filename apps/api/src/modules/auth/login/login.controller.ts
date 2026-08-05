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
  ): Promise<Omit<CurrentUserPayload, 'jti' | 'iat' | 'exp'>> {
    const { token, user } = await this.loginService.login(dto);

    res.set('Cache-Control', 'no-store');
    // headers/flags do cookie conforme o card do trello. secure exige https, então em
    // http://localhost o navegador pode n salvar o cookie (testar via https/tunnel)
    res.cookie('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 * 1000,
    });

    return user;
  }
}
