import { Module } from '@nestjs/common';
import { RecuperarSenhaController } from './recuperar-senha.controller';
import { RecuperarSenhaService } from './recuperar-senha.service';

@Module({
  controllers: [RecuperarSenhaController],
  providers: [RecuperarSenhaService],
})
export class RecuperarSenhaModule {}
