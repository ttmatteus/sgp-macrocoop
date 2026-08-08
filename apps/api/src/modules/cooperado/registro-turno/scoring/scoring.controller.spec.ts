import { Test, TestingModule } from '@nestjs/testing';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';

describe('ScoringController', () => {
  let controller: ScoringController;
  let service: { processarUm: jest.Mock };

  beforeEach(async () => {
    service = { processarUm: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScoringController],
      providers: [{ provide: ScoringService, useValue: service }],
    }).compile();

    controller = module.get<ScoringController>(ScoringController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('repassa o registroPontoId da mensagem pro service', async () => {
    await controller.aoRegistrarPonto({ registroPontoId: 42 });

    expect(service.processarUm).toHaveBeenCalledWith(42);
  });
});
