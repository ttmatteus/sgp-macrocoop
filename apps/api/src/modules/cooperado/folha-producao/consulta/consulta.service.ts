import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FolhaProducaoDto,
  FolhaMensagensDto,
  ProducaoParcialDto,
} from './dto/folha-producao.dto';

@Injectable()
export class ConsultaService {
  async buscarPorCompetencia(
    vinculoId: number,
    ano: number,
    mes: number,
  ): Promise<FolhaProducaoDto> {
    throw new NotFoundException('Nao implementado');
  }

  async buscarMensagens(
    vinculoId: number,
    ano: number,
    mes: number,
  ): Promise<FolhaMensagensDto> {
    throw new NotFoundException('Nao implementado');
  }

  async calcularParcial(vinculoId: number): Promise<ProducaoParcialDto> {
    throw new NotFoundException('Nao implementado');
  }
}
