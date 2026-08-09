import { cookies } from 'next/headers'

export interface SessionUser {
  login: string
  nome: string
  nivel: 'coordenador' | 'cooperado'
  cooperativa: { id: number; nome: string; codigo: string }
}

// o jwt ja carrega nome/nivel/cooperativa embutidos (por isso n existe endpoint /me).
// aqui so decodifica o payload pra exibir na tela, sem chamada de rede nenhuma.
// n verifica assinatura pq o cookie e httpOnly e so quem seta ele e a nossa propria
// server action de login, e isso e usado so pra exibicao, n pra autorizar nada
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null

  try {
    const payloadBase64 = token.split('.')[1]
    const json = Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    return JSON.parse(json) as SessionUser
  } catch {
    return null
  }
}
