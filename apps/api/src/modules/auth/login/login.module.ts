import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { LoginRateLimitInterceptor } from '../../../common/interceptors/login-rate-limit.interceptor';

@Module({
  controllers: [LoginController],
  providers: [LoginService, LoginRateLimitInterceptor],
})
export class LoginModule {}
