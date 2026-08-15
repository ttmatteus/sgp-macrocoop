import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { SessoesController } from './sessoes.controller';
import { SessoesService } from './sessoes.service';
import { RedisService } from '../../../core/redis/redis.service';
import type { CurrentUserPayload } from '../../../core/auth/current-user.interface';

describe('SessoesController', () => {
  let controller: SessoesController;
  const sessoesService = { listar: jest.fn(), revogar: jest.fn() };

  const user: CurrentUserPayload = {
    jti: 'jti-atual',
    iat: 0,
    exp: 0,
    vinculoId: 7,
    pessoaId: 1,
    login: 'cooperado',
    nome: 'Cooperado',
    nivel: 'cooperado',
    permissoes: [],
    cooperativa: { id: 1, nome: 'Macrocoop', codigo: 'MACRO' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessoesController],
      providers: [
        { provide: SessoesService, useValue: sessoesService },
        // o JwtAuthGuard do controller precisa desses dois pra instanciar
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: RedisService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<SessoesController>(SessoesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('lista as sessoes do vinculo autenticado, com o jti da propria sessao', async () => {
    sessoesService.listar.mockResolvedValue([]);

    await controller.listar(user);

    expect(sessoesService.listar).toHaveBeenCalledWith(7, 'jti-atual');
  });

  it('revoga usando o vinculo do usuario autenticado, nunca o da url', async () => {
    await controller.revogar(user, 'jti-alvo');

    expect(sessoesService.revogar).toHaveBeenCalledWith(7, 'jti-alvo');
  });
});
