import { revogarTodasAsSessoes, revogarUmaSessao } from './sessions';

describe('revogarTodasAsSessoes', () => {
  const redis = {
    smembers: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    srem: jest.fn(),
    sismember: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('nao faz nada quando o indice esta vazio', async () => {
    redis.smembers.mockResolvedValue([]);

    await revogarTodasAsSessoes(redis as never, 7);

    expect(redis.set).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('denylista, apaga o detalhe de cada sessao e limpa o indice', async () => {
    redis.smembers.mockResolvedValue(['jti-1', 'jti-2']);

    await revogarTodasAsSessoes(redis as never, 7);

    expect(redis.set).toHaveBeenCalledWith('denylist:jti:jti-1', '1', { ex: 3600 });
    expect(redis.set).toHaveBeenCalledWith('denylist:jti:jti-2', '1', { ex: 3600 });
    expect(redis.del).toHaveBeenCalledWith('auth:sessao:jti-1');
    expect(redis.del).toHaveBeenCalledWith('auth:sessao:jti-2');
    expect(redis.del).toHaveBeenCalledWith('auth:sessoes:7');
  });
});

describe('revogarUmaSessao', () => {
  const redis = {
    smembers: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    srem: jest.fn(),
    sismember: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('retorna false e nao mexe em nada quando o jti nao pertence ao vinculo', async () => {
    redis.sismember.mockResolvedValue(0);

    const revogou = await revogarUmaSessao(redis as never, 7, 'jti-de-outro');

    expect(revogou).toBe(false);
    expect(redis.set).not.toHaveBeenCalled();
    expect(redis.srem).not.toHaveBeenCalled();
  });

  it('denylista, apaga o detalhe e remove do indice quando pertence', async () => {
    redis.sismember.mockResolvedValue(1);

    const revogou = await revogarUmaSessao(redis as never, 7, 'jti-x');

    expect(revogou).toBe(true);
    expect(redis.set).toHaveBeenCalledWith('denylist:jti:jti-x', '1', { ex: 3600 });
    expect(redis.del).toHaveBeenCalledWith('auth:sessao:jti-x');
    expect(redis.srem).toHaveBeenCalledWith('auth:sessoes:7', 'jti-x');
  });
});
