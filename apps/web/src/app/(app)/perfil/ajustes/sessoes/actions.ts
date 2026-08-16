'use server'

import { cookies } from 'next/headers'
import { unstable_rethrow } from 'next/navigation'
import { apiFetch, apiFetchOuRedirecionar } from '@/lib/backend'

export interface Sessao {
  jti: string
  ip: string
  userAgent: string
  criadoEm: string
  atual: boolean
}

export interface ListarSessoesResult {
  ok: boolean
  itens: Sessao[]
}

export async function listarSessoes(): Promise<ListarSessoesResult> {
  try {
    const res = await apiFetchOuRedirecionar('/sessoes')
    if (!res.ok) return { ok: false, itens: [] }
    return { ok: true, itens: await res.json() }
  } catch (erro) {
    unstable_rethrow(erro)
    return { ok: false, itens: [] }
  }
}

export interface RevogarResult {
  ok: boolean
  erro?: 'senha_incorreta' | 'nao_encontrado' | 'conexao'
}

function erroDoStatus(status: number): RevogarResult['erro'] {
  if (status === 401) return 'senha_incorreta'
  if (status === 404) return 'nao_encontrado'
  return 'conexao'
}

export async function revogarSessao(jti: string, senha: string): Promise<RevogarResult> {
  try {
    const res = await apiFetch(`/sessoes/${encodeURIComponent(jti)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    })
    if (res.ok) return { ok: true }
    return { ok: false, erro: erroDoStatus(res.status) }
  } catch {
    return { ok: false, erro: 'conexao' }
  }
}

// revoga inclusive a sessao atual, entao o cookie local morre junto
export async function revogarTodasSessoes(senha: string): Promise<RevogarResult> {
  try {
    const res = await apiFetch('/sessoes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    })

    if (!res.ok) return { ok: false, erro: erroDoStatus(res.status) }

    const cookieStore = await cookies()
    cookieStore.delete('session')
    return { ok: true }
  } catch {
    return { ok: false, erro: 'conexao' }
  }
}
