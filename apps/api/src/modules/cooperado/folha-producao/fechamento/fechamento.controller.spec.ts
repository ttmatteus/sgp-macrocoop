import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { FechamentoController } from './fechamento.controller';
import { RedisService } from '../../../../core/redis/redis.service';

describe('FechamentoController', () => {
  let controller: FechamentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FechamentoController],
      providers: [
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: RedisService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<FechamentoController>(FechamentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
