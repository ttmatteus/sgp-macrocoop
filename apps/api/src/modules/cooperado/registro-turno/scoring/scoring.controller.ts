import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ScoringService } from './scoring.service';
import { FILA_SCORING } from '../../../../core/rabbitmq/rabbitmq.constants';

@Controller()
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @EventPattern(FILA_SCORING)
  async aoRegistrarPonto(@Payload() dados: { registroPontoId: number }): Promise<void> {
    await this.scoringService.processarUm(dados.registroPontoId);
  }
}
