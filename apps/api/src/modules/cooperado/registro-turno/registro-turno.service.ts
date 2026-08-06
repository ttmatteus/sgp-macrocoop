import { Injectable } from '@nestjs/common';
import {
  ContratoDisponivelDto,
  RegistrarPontoDto,
  RegistroPontoDto,
} from './dto/registro-turno.dto';

@Injectable()
export class RegistroTurnoService {
  async listarContratosDisponiveis(
    vinculoId: number,
  ): Promise<ContratoDisponivelDto[]> {
    throw new Error('Nao implementado');
  }

  async registrar(
    vinculoId: number,
    dados: RegistrarPontoDto,
  ): Promise<RegistroPontoDto> {
    throw new Error('Nao implementado');
  }

  async validarAlocacaoAtiva(
    vinculoId: number,
    contratoId: number,
  ): Promise<void> {
    throw new Error('Nao implementado');
  }

  async validarRaioDeTolerancia(
    contratoId: number,
    latitude: number,
    longitude: number,
  ): Promise<{ localPontoId: number; distanciaM: number; status: string }> {
    throw new Error('Nao implementado');
  }

  async abrirOuFecharTurno(registroPontoId: number): Promise<number> {
    throw new Error('Nao implementado');
  }

  async publicarPontoRegistrado(registroPontoId: number): Promise<void> {
    throw new Error('Nao implementado');
  }
}
