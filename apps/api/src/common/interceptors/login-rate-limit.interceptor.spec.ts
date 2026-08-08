import { ExecutionContext, CallHandler, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom, of, throwError } from 'rxjs';
import { LoginRateLimitInterceptor } from './login-rate-limit.interceptor';
import { RedisService } from '../../core/redis/redis.service';

const TOO_MANY = { status: HttpStatus.TOO_MANY_REQUESTS };

describe('LoginRateLimitInterceptor', () => {
  let interceptor: LoginRateLimitInterceptor;
  let redis: { get: jest.Mock; incr: jest.Mock; expire: jest.Mock; del: jest.Mock; ttl: jest.Mock };

  const mockCtx = (body: Record<string, unknown> = { usuario: 'andrei' }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          ip: '203.0.113.1',
          headers: {},
          body,
        }),
      }),
    }) as unknown as ExecutionContext;

  const handler = (data: unknown, err?: unknown): CallHandler => ({
    handle: () => (err ? throwError(() => err) : of(data)),
  });

  beforeEach(async () => {
    redis = {
      get: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
      ttl: jest.fn().mockResolvedValue(900),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginRateLimitInterceptor,
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    interceptor = module.get<LoginRateLimitInterceptor>(LoginRateLimitInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('deve resetar a chave no sucesso (DEL)', async () => {
    redis.get.mockResolvedValue('1');
    redis.del.mockResolvedValue(1);

    await lastValueFrom(interceptor.intercept(mockCtx(), handler({ ok: true })));

    expect(redis.get).toHaveBeenCalledWith('login:attempts:203.0.113.1:andrei');
    expect(redis.del).toHaveBeenCalledWith('login:attempts:203.0.113.1:andrei');
    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('deve incrementar e setar EXPIRE na 1ª falha (Unauthorized)', async () => {
    redis.get.mockResolvedValue(null);
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);

    await expect(
      lastValueFrom(interceptor.intercept(mockCtx(), handler(null, new UnauthorizedException()))),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(redis.incr).toHaveBeenCalledWith('login:attempts:203.0.113.1:andrei');
    expect(redis.expire).toHaveBeenCalledWith('login:attempts:203.0.113.1:andrei', 900);
  });

  it('deve NÃO renovar EXPIRE nas falhas seguintes (janela fixa)', async () => {
    redis.get.mockResolvedValue('2');
    redis.incr.mockResolvedValue(3);

    await expect(
      lastValueFrom(interceptor.intercept(mockCtx(), handler(null, new UnauthorizedException()))),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(redis.incr).toHaveBeenCalled();
    expect(redis.expire).not.toHaveBeenCalled();
  });

  it('deve bloquear (429) antes do handler quando count >= 5', async () => {
    redis.get.mockResolvedValue('5');

    await expect(
      lastValueFrom(interceptor.intercept(mockCtx(), handler({ ok: true }))),
    ).rejects.toMatchObject(TOO_MANY);

    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('deve trocar 401 por 429 na 5ª falha', async () => {
    redis.get.mockResolvedValue('4');
    redis.incr.mockResolvedValue(5);
    redis.expire.mockResolvedValue(1);

    await expect(
      lastValueFrom(interceptor.intercept(mockCtx(), handler(null, new UnauthorizedException()))),
    ).rejects.toMatchObject(TOO_MANY);
  });

  it('deve degradar gracioso quando Redis GET falha', async () => {
    redis.get.mockRejectedValue(new Error('upstash down'));
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);

    await lastValueFrom(interceptor.intercept(mockCtx(), handler({ ok: true })));

    expect(redis.del).toHaveBeenCalled();
  });

  it('deve deixar erros não-Unauthorized passarem sem incrementar', async () => {
    redis.get.mockResolvedValue('1');
    const erroGenerico = new Error('boom interno');

    await expect(
      lastValueFrom(interceptor.intercept(mockCtx(), handler(null, erroGenerico))),
    ).rejects.toBe(erroGenerico);

    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('mantém a contagem do INCR mesmo quando o EXPIRE falha (não mascara um INCR válido)', async () => {
    redis.get.mockResolvedValue(null);
    redis.incr.mockResolvedValue(1);
    redis.expire.mockRejectedValue(new Error('upstash down'));

    await expect(
      lastValueFrom(interceptor.intercept(mockCtx(), handler(null, new UnauthorizedException()))),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(redis.incr).toHaveBeenCalled();
    expect(redis.expire).toHaveBeenCalled();
  });

  it('devolve o retry-after (TTL da chave) no corpo do 429 ao bloquear antes do handler', async () => {
    redis.get.mockResolvedValue('5');
    redis.ttl.mockResolvedValue(573);

    try {
      await lastValueFrom(interceptor.intercept(mockCtx(), handler({ ok: true })));
      fail('deveria ter lançado');
    } catch (err) {
      expect(err).toMatchObject(TOO_MANY);
      expect((err as { getResponse: () => unknown }).getResponse()).toMatchObject({
        retryAfter: 573,
      });
    }
  });

  it('devolve a janela cheia como retry-after quando o TTL falha ou não existe', async () => {
    redis.get.mockResolvedValue('4');
    redis.incr.mockResolvedValue(5);
    redis.expire.mockResolvedValue(1);
    redis.ttl.mockResolvedValue(-2);

    try {
      await lastValueFrom(interceptor.intercept(mockCtx(), handler(null, new UnauthorizedException())));
      fail('deveria ter lançado');
    } catch (err) {
      expect((err as { getResponse: () => unknown }).getResponse()).toMatchObject({
        retryAfter: 900,
      });
    }
  });
});
