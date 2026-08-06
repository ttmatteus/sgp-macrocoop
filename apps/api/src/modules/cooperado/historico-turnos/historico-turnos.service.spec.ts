import { Test, TestingModule } from '@nestjs/testing';
import { HistoricoTurnosService } from './historico-turnos.service';
import { PrismaService } from '../../../core/prisma/prisma.service';

describe('HistoricoTurnosService', () => {
  let service: HistoricoTurnosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistoricoTurnosService,
        {
          provide: PrismaService,
          useValue: {
            turno: { findMany: jest.fn(), count: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<HistoricoTurnosService>(HistoricoTurnosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
