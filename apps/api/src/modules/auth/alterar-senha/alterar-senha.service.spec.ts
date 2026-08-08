import { Test, TestingModule } from '@nestjs/testing';
import { AlterarSenhaService } from './alterar-senha.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';

describe('AlterarSenhaService', () => {
  let service: AlterarSenhaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlterarSenhaService,
        {
          provide: PrismaService,
          useValue: {
            vinculo_cooperativa: { findUnique: jest.fn(), update: jest.fn() },
          },
        },
        { provide: RedisService, useValue: { set: jest.fn() } },
      ],
    }).compile();

    service = module.get<AlterarSenhaService>(AlterarSenhaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
