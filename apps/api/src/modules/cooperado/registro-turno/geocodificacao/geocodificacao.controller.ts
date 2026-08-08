import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { GeocodificacaoService } from './geocodificacao.service';
import { FILA_GEOCODING } from '../../../../core/rabbitmq/rabbitmq.constants';

@Controller()
export class GeocodificacaoController {
  constructor(private readonly geocodificacaoService: GeocodificacaoService) {}

  @EventPattern(FILA_GEOCODING)
  async aoRegistrarPonto(@Payload() dados: { registroPontoId: number }): Promise<void> {
    await this.geocodificacaoService.processarUm(dados.registroPontoId);
  }
}
