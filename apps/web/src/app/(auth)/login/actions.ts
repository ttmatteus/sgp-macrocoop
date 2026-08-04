'use server'

import { cookies } from 'next/headers'
import { getServerApiUrl } from '@/lib/backend'

export interface LoginResult {
  ok: boolean
  erro?: 'credenciais' | 'conexao'
}

export async function login(usuario: string, senha: string): Promise<LoginResult> {
  try {
    const res = await fetch(`${getServerApiUrl()}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha }),
    })

    if (!res.ok) {
      return { ok: false, erro: 'credenciais' }
    }

    const setCookie = res.headers.getSetCookie().find((c) => c.startsWith('session='))
    const token = setCookie?.split(';')[0]?.split('=')[1]

    if (!token) {
      return { ok: false, erro: 'conexao' }
    }

    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      // dev local é http puro, secure:true faria o navegador recusar o cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    })

    return { ok: true }
  } catch {
    return { ok: false, erro: 'conexao' }
  }
}
