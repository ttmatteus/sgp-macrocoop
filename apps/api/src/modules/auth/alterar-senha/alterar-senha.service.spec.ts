import { Test, TestingModule } from '@nestjs/testing';
import { AlterarSenhaService } from './alterar-senha.service';

describe('AlterarSenhaService', () => {
  let service: AlterarSenhaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlterarSenhaService],
    }).compile();

    service = module.get<AlterarSenhaService>(AlterarSenhaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
