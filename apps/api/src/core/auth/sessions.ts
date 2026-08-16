import { RedisService } from '../redis/redis.service';
import {
  activeSessionsKey,
  deniedSessionKey,
  sessionDetailKey,
  SESSION_TTL_SECONDS,
} from './session.constants';

// usado na troca de senha e no "encerrar todas" da tela de sessoes ativas
export async function revogarTodasAsSessoes(
  redis: RedisService,
  vinculoId: number,
): Promise<void> {
  const chaveIndice = activeSessionsKey(vinculoId);
  const jtis = await redis.smembers<string[]>(chaveIndice);
  if (jtis.length === 0) return;

  await Promise.all([
    ...jtis.map((jti) =>
      redis.set(deniedSessionKey(jti), '1', { ex: SESSION_TTL_SECONDS }),
    ),
    ...jtis.map((jti) => redis.del(sessionDetailKey(jti))),
  ]);
  await redis.del(chaveIndice);
}

// false se o jti nao pertencia a esse vinculo
export async function revogarUmaSessao(
  redis: RedisService,
  vinculoId: number,
  jti: string,
): Promise<boolean> {
  const chaveIndice = activeSessionsKey(vinculoId);
  const pertence = await redis.sismember(chaveIndice, jti);
  if (!pertence) return false;

  await Promise.all([
    redis.set(deniedSessionKey(jti), '1', { ex: SESSION_TTL_SECONDS }),
    redis.del(sessionDetailKey(jti)),
    redis.srem(chaveIndice, jti),
  ]);
  return true;
}
