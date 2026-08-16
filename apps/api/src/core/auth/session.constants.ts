export const SESSION_TTL_SECONDS = 60 * 60;

export function activeSessionsKey(vinculoId: number) {
  return `auth:sessoes:${vinculoId}`;
}

export function deniedSessionKey(jti: string) {
  return `denylist:jti:${jti}`;
}

export function sessionDetailKey(jti: string) {
  return `auth:sessao:${jti}`;
}
