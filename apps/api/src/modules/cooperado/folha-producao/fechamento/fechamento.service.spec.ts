import { Test, TestingModule } from '@nestjs/testing';
import { FechamentoService } from './fechamento.service';
import { PrismaService } from '../../../../core/prisma/prisma.service';

describe('FechamentoService', () => {
  let service: FechamentoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FechamentoService,
        {
          provide: PrismaService,
          useValue: {
            folha_producao: { upsert: jest.fn() },
            turno: { findMany: jest.fn() },
            faixa_inss: { findMany: jest.fn() },
            faixa_irrf: { findMany: jest.fn() },
            vinculo_cooperativa: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<FechamentoService>(FechamentoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

});
