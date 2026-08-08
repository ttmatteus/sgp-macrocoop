import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AlterarSenhaController } from './alterar-senha.controller';
import { AlterarSenhaService } from './alterar-senha.service';
import { RedisService } from '../../../core/redis/redis.service';

describe('AlterarSenhaController', () => {
  let controller: AlterarSenhaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlterarSenhaController],
      providers: [
        { provide: AlterarSenhaService, useValue: { alterarSenha: jest.fn() } },
        // o JwtAuthGuard do controller precisa desses dois pra instanciar
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: RedisService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AlterarSenhaController>(AlterarSenhaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
