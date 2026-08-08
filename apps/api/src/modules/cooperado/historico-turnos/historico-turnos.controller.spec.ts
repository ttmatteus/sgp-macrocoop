import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { HistoricoTurnosController } from './historico-turnos.controller';
import { HistoricoTurnosService } from './historico-turnos.service';
import { RedisService } from '../../../core/redis/redis.service';

describe('HistoricoTurnosController', () => {
  let controller: HistoricoTurnosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistoricoTurnosController],
      providers: [
        {
          provide: HistoricoTurnosService,
          useValue: { listar: jest.fn() },
        },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: RedisService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<HistoricoTurnosController>(
      HistoricoTurnosController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

});
