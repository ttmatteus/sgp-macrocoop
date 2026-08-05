import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SESSION_TTL_SECONDS } from './session.constants';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env['JWT_SECRET'],
      // 1h por enquanto, provisorio, ainda n fechou com o stakeholder o tempo
      // certo (ver card do trello)
      signOptions: { expiresIn: SESSION_TTL_SECONDS },
    }),
  ],
  providers: [JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthCoreModule {}
