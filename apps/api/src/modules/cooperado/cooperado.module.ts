import { Module } from '@nestjs/common';
import { PerfilModule } from './perfil/perfil.module';
import { FolhaProducaoModule } from './folha-producao/folha-producao.module';
import { HistoricoTurnosModule } from './historico-turnos/historico-turnos.module';
import { RegistroTurnoModule } from './registro-turno/registro-turno.module';

@Module({
  imports: [
    PerfilModule,
    FolhaProducaoModule,
    HistoricoTurnosModule,
    RegistroTurnoModule,
  ],
})
export class CooperadoModule {}
