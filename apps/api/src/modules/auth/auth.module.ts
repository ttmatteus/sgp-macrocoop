import { Module } from '@nestjs/common';
import { LoginModule } from './login/login.module';
import { RecuperarSenhaModule } from './recuperar-senha/recuperar-senha.module';
import { AlterarSenhaModule } from './alterar-senha/alterar-senha.module';

@Module({
  imports: [LoginModule, RecuperarSenhaModule, AlterarSenhaModule],
})
export class AuthModule {}
