import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';
import { RegistroTurnoController } from './registro-turno.controller';
import { RegistroTurnoService } from './registro-turno.service';
import { RegistrarPontoDto } from './dto/registro-turno.dto';
import { RedisService } from '../../../core/redis/redis.service';
import type { CurrentUserPayload } from '../../../core/auth/current-user.interface';

describe('RegistroTurnoController', () => {
  let controller: RegistroTurnoController;
  let service: {
    listarContratosDisponiveis: jest.Mock
    registrar: jest.Mock
    buscarTurnoAberto: jest.Mock
  };

  const user = { vinculoId: 1 } as CurrentUserPayload;
  const dadosVazios = {} as RegistrarPontoDto;
  const res = { status: jest.fn().mockReturnThis() } as unknown as Response;

  beforeEach(async () => {
    service = {
      listarContratosDisponiveis: jest.fn(),
      registrar: jest.fn(),
      buscarTurnoAberto: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistroTurnoController],
      providers: [
        { provide: RegistroTurnoService, useValue: service },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        { provide: RedisService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    controller = module.get<RegistroTurnoController>(RegistroTurnoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('lista contratos disponíveis do vínculo logado', async () => {
    service.listarContratosDisponiveis.mockResolvedValue([{ id: 1 }]);

    const resultado = await controller.listarContratosDisponiveis(user);

    expect(service.listarContratosDisponiveis).toHaveBeenCalledWith(1);
    expect(resultado).toEqual([{ id: 1 }]);
  });

  it('responde 204 quando não há turno aberto', async () => {
    service.buscarTurnoAberto.mockResolvedValue(null)

    const resultado = await controller.obterTurnoAberto(user, res)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
    expect(resultado).toBeUndefined()
  })

  it('devolve o turno aberto sem mexer no status quando existe', async () => {
    service.buscarTurnoAberto.mockResolvedValue({ id: 42 })

    const resultado = await controller.obterTurnoAberto(user, res)

    expect(resultado).toEqual({ id: 42 })
    expect(service.buscarTurnoAberto).toHaveBeenCalledWith(1)
  })

  it('responde 201 quando o registro é criado', async () => {
    service.registrar.mockResolvedValue({ dto: { id: 1 }, criado: true });

    await controller.registrar(user, dadosVazios, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
  });

  it('responde 200 quando é um reenvio idempotente (registro já existia)', async () => {
    service.registrar.mockResolvedValue({ dto: { id: 1 }, criado: false });

    await controller.registrar(user, dadosVazios, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
  });
});
