import { cookies } from 'next/headers'

export function getServerApiUrl() {
  const url = process.env.API_URL
  if (!url) {
    throw new Error('API_URL não configurada')
  }
  return url
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const cookieStore = await cookies()
  const sessao = cookieStore.get('session')

  return fetch(`${getServerApiUrl()}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      ...(sessao ? { cookie: `session=${sessao.value}` } : {}),
    },
  })
}
