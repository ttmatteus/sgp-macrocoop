import { Test, TestingModule } from '@nestjs/testing';
import { RecuperarSenhaController } from './recuperar-senha.controller';

describe('RecuperarSenhaController', () => {
  let controller: RecuperarSenhaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecuperarSenhaController],
    }).compile();

    controller = module.get<RecuperarSenhaController>(RecuperarSenhaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
