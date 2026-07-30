import { Module } from '@nestjs/common';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';

@Module({
  controllers: [PerfilController],
  providers: [PerfilService],
})
export class PerfilModule {}
