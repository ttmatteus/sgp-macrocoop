import { Test, TestingModule } from '@nestjs/testing';
import { HEADERS_METADATA } from '@nestjs/common/constants';
import { RecuperarSenhaController } from './recuperar-senha.controller';
import { RecuperarSenhaService } from './recuperar-senha.service';

describe('RecuperarSenhaController', () => {
  let controller: RecuperarSenhaController;
  const service = {
    solicitarPorUsuario: jest.fn(),
    solicitarPorEmail: jest.fn(),
    consultarToken: jest.fn(),
    redefinir: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecuperarSenhaController],
      providers: [{ provide: RecuperarSenhaService, useValue: service }],
    }).compile();

    controller = module.get<RecuperarSenhaController>(RecuperarSenhaController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('solicita recuperação por usuário', async () => {
    const resposta = {
      sucesso: true,
      modo: 'dev' as const,
      token: 'token',
      expiracaoToken: new Date().toISOString(),
    };
    service.solicitarPorUsuario.mockResolvedValue(resposta);

    await expect(
      controller.solicitarPorUsuario({ usuario: 'cooperado' }, '127.0.0.1'),
    ).resolves.toEqual(resposta);
    expect(service.solicitarPorUsuario).toHaveBeenCalledWith(
      'cooperado',
      '127.0.0.1',
    );
  });

  it('impede cache da resposta com token', () => {
    const headers = Reflect.getMetadata(
      HEADERS_METADATA,
      RecuperarSenhaController.prototype.solicitarPorUsuario,
    );

    expect(headers).toContainEqual({
      name: 'Cache-Control',
      value: 'no-store',
    });
  });

  it('solicita recuperação por e-mail', async () => {
    service.solicitarPorEmail.mockResolvedValue({ modo: 'dev' });

    await controller.solicitarPorEmail(
      { email: 'cooperado@macrocoop.com.br' },
      '127.0.0.1',
    );

    expect(service.solicitarPorEmail).toHaveBeenCalledWith(
      'cooperado@macrocoop.com.br',
      '127.0.0.1',
    );
  });

  it('redefine a senha com token', async () => {
    service.redefinir.mockResolvedValue({ mensagem: 'ok' });

    await controller.redefinir({ token: 'token', senha: 'Senha123' });

    expect(service.redefinir).toHaveBeenCalledWith('token', 'Senha123');
  });

  it('consulta os dados do token de redefinição', async () => {
    service.consultarToken.mockResolvedValue({ tokenValido: true });

    await controller.consultarToken({ token: 'token' });

    expect(service.consultarToken).toHaveBeenCalledWith('token');
  });
});
