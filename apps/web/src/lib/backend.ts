import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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
    cache: 'no-store',
    headers: {
      ...init.headers,
      ...(sessao ? { cookie: `session=${sessao.value}` } : {}),
    },
  })
}

// pra leituras de tela: 401 aqui so significa "sessao morta", manda pro
// login. nao usar em acao que confirma senha (401 = senha errada la).
// quem chama precisa fazer catch (erro) { unstable_rethrow(erro); ... },
// senao o catch engole o redirect
export async function apiFetchOuRedirecionar(path: string, init: RequestInit = {}) {
  const res = await apiFetch(path, init)
  if (res.status === 401) {
    // sem cookieStore.delete aqui: cookie so pode ser modificado em server
    // action/route handler, nao durante render de server component
    redirect('/login?motivo=sessao-encerrada')
  }
  return res
}
