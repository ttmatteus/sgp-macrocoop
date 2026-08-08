import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { RabbitmqPublisherService } from './rabbitmq-publisher.service';
import { FILA_GEOCODING, FILA_SCORING } from './rabbitmq.constants';

describe('RabbitmqPublisherService', () => {
  let service: RabbitmqPublisherService;
  let scoringClient: { emit: jest.Mock };
  let geocodingClient: { emit: jest.Mock };

  beforeEach(async () => {
    scoringClient = { emit: jest.fn().mockReturnValue(of(undefined)) };
    geocodingClient = { emit: jest.fn().mockReturnValue(of(undefined)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitmqPublisherService,
        { provide: FILA_SCORING, useValue: scoringClient },
        { provide: FILA_GEOCODING, useValue: geocodingClient },
      ],
    }).compile();

    service = module.get<RabbitmqPublisherService>(RabbitmqPublisherService);
  });

  it('publica o mesmo payload nas duas filas, uma por consumidor', async () => {
    await service.publicarPontoRegistrado(42);

    expect(scoringClient.emit).toHaveBeenCalledWith(FILA_SCORING, { registroPontoId: 42 });
    expect(geocodingClient.emit).toHaveBeenCalledWith(FILA_GEOCODING, { registroPontoId: 42 });
  });

  it('não lança quando uma das filas falha (a outra publica normalmente)', async () => {
    scoringClient.emit.mockReturnValue(throwError(() => new Error('fila fora do ar')));

    await expect(service.publicarPontoRegistrado(42)).resolves.toBeUndefined();
    expect(geocodingClient.emit).toHaveBeenCalledWith(FILA_GEOCODING, { registroPontoId: 42 });
  });

  it('não lança quando as duas filas falham', async () => {
    scoringClient.emit.mockReturnValue(throwError(() => new Error('fila fora do ar')));
    geocodingClient.emit.mockReturnValue(throwError(() => new Error('fila fora do ar')));

    await expect(service.publicarPontoRegistrado(42)).resolves.toBeUndefined();
  });
});
