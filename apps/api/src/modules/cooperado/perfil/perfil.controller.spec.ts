import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PerfilController } from './perfil.controller';
import { PerfilService } from './perfil.service';
import { RedisService } from '../../../core/redis/redis.service';

describe('PerfilController', () => {
  let controller: PerfilController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerfilController],
      providers: [
        {
          provide: PerfilService,
          useValue: { buscarPerfilDoCooperado: jest.fn() },
        },
        // o JwtAuthGuard do controller precisa desses dois pra instanciar
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: RedisService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<PerfilController>(PerfilController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
