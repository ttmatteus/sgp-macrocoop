import { Injectable } from '@nestjs/common';
import {
  HistoricoTurnosDto,
  HistoricoTurnosQueryDto,
} from './dto/historico-turnos.dto';

@Injectable()
export class HistoricoTurnosService {
  async listar(
    vinculoId: number,
    filtros: HistoricoTurnosQueryDto,
  ): Promise<HistoricoTurnosDto> {
    throw new Error('Nao implementado');
  }
}
