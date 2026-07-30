import { Test, TestingModule } from '@nestjs/testing';
import { RecuperarSenhaService } from './recuperar-senha.service';

describe('RecuperarSenhaService', () => {
  let service: RecuperarSenhaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecuperarSenhaService],
    }).compile();

    service = module.get<RecuperarSenhaService>(RecuperarSenhaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
