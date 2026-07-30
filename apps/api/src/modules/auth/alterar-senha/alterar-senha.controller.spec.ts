import { Test, TestingModule } from '@nestjs/testing';
import { AlterarSenhaController } from './alterar-senha.controller';

describe('AlterarSenhaController', () => {
  let controller: AlterarSenhaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlterarSenhaController],
    }).compile();

    controller = module.get<AlterarSenhaController>(AlterarSenhaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
