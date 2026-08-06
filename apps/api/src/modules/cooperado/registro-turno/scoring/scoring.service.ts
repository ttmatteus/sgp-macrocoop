import { Injectable } from '@nestjs/common';

@Injectable()
export class ScoringService {
  async processarPontoRegistrado(registroPontoId: number): Promise<void> {
    throw new Error('Nao implementado');
  }

  async calcularScore(registroPontoId: number): Promise<number> {
    throw new Error('Nao implementado');
  }

  async gravarScore(registroPontoId: number, score: number): Promise<void> {
    throw new Error('Nao implementado');
  }
}
