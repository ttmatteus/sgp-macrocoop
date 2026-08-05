import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUserPayload } from '../../../core/auth/current-user.interface';
import { SESSION_TTL_SECONDS } from '../../../core/auth/session.constants';
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
    // o next chama esse endpoint server-to-server (server action) e le o cookie
    // do header Set-Cookie pra setar o dele mesmo. o token nunca vai no body
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
