import { Test, TestingModule } from '@nestjs/testing';
import { GeocodificacaoController } from './geocodificacao.controller';
import { GeocodificacaoService } from './geocodificacao.service';

describe('GeocodificacaoController', () => {
  let controller: GeocodificacaoController;
  let service: { processarUm: jest.Mock };

  beforeEach(async () => {
    service = { processarUm: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeocodificacaoController],
      providers: [{ provide: GeocodificacaoService, useValue: service }],
    }).compile();

    controller = module.get<GeocodificacaoController>(GeocodificacaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('repassa o registroPontoId da mensagem pro service', async () => {
    await controller.aoRegistrarPonto({ registroPontoId: 42 });

    expect(service.processarUm).toHaveBeenCalledWith(42);
  });
});
