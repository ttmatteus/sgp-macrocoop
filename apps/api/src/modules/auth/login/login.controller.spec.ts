import { Test, TestingModule } from '@nestjs/testing';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { LoginRateLimitInterceptor } from '../../../common/interceptors/login-rate-limit.interceptor';
import { RedisService } from '../../../core/redis/redis.service';

describe('LoginController', () => {
  let controller: LoginController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginController],
      providers: [
        { provide: LoginService, useValue: { login: jest.fn() } },
        // @UseInterceptors(LoginRateLimitInterceptor) precisa resolver a
        // classe via DI no compile(); ela por sua vez precisa do RedisService
        LoginRateLimitInterceptor,
        { provide: RedisService, useValue: {} },
      ],
    }).compile();

    controller = module.get<LoginController>(LoginController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
