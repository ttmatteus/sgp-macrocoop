import { Test, TestingModule } from '@nestjs/testing';
import { ConsultaService } from './consulta.service';
import { PrismaService } from '../../../../core/prisma/prisma.service';

describe('ConsultaService', () => {
  let service: ConsultaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultaService,
        {
          provide: PrismaService,
          useValue: {
            folha_producao: { findUnique: jest.fn(), findFirst: jest.fn() },
            turno: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<ConsultaService>(ConsultaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
