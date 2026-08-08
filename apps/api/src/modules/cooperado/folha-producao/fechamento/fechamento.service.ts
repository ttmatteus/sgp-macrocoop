import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class FechamentoService {
  @Cron('0 3 1-12 * *', { timeZone: 'America/Sao_Paulo' })
  async executarFechamentoAgendado(): Promise<void> {
    throw new Error('Nao implementado');
  }

  hojeEhOQuintoDiaUtil(): boolean {
    throw new Error('Nao implementado');
  }

  async fecharCompetencia(ano: number, mes: number): Promise<void> {
    throw new Error('Nao implementado');
  }

  async calcularVinculo(vinculoId: number, ano: number, mes: number): Promise<void> {
    throw new Error('Nao implementado');
  }

  async calcularInss(base: number, competencia: Date): Promise<number> {
    throw new Error('Nao implementado');
  }

  async calcularIrrf(base: number, competencia: Date): Promise<number> {
    throw new Error('Nao implementado');
  }

  async gravar(): Promise<void> {
    throw new Error('Nao implementado');
  }
}
