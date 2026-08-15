import { Test, TestingModule } from '@nestjs/testing';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { LoginRateLimitInterceptor } from '../../../common/interceptors/login-rate-limit.interceptor';
import { RedisService } from '../../../core/redis/redis.service';

describe('LoginController', () => {
  let controller: LoginController;
  const loginService = { login: jest.fn() };
  const res = { set: jest.fn(), cookie: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [
        { provide: LoginService, useValue: loginService },
        // @UseInterceptors(LoginRateLimitInterceptor) precisa resolver a
        // classe via DI no compile(); ela por sua vez precisa do RedisService
        LoginRateLimitInterceptor,
        { provide: RedisService, useValue: {} },
      ],
    }).compile();

    controller = module.get<LoginController>(LoginController);
    jest.clearAllMocks();
    loginService.login.mockResolvedValue({ token: 'tok', user: {} });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('repassa ip e user-agent dos headers pro service', async () => {
    await controller.login(
      { usuario: 'x', senha: 'y' },
      '203.0.113.1',
      'Mozilla/5.0',
      res as never,
    );

    expect(loginService.login).toHaveBeenCalledWith(
      { usuario: 'x', senha: 'y' },
      { ip: '203.0.113.1', userAgent: 'Mozilla/5.0' },
    );
  });

  it('usa "desconhecido" quando os headers nao vem', async () => {
    await controller.login({ usuario: 'x', senha: 'y' }, undefined, undefined, res as never);

    expect(loginService.login).toHaveBeenCalledWith(
      { usuario: 'x', senha: 'y' },
      { ip: 'desconhecido', userAgent: 'desconhecido' },
    );
  });
});
