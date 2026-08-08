import { Test, TestingModule } from '@nestjs/testing';
import { PerfilService } from './perfil.service';
import { PrismaService } from '../../../core/prisma/prisma.service';

describe('PerfilService', () => {
  let service: PerfilService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerfilService,
        {
          provide: PrismaService,
          useValue: { vinculo_cooperativa: { findUnique: jest.fn() } },
        },
      ],
    }).compile();

    service = module.get<PerfilService>(PerfilService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
