'use server'

import { cookies } from 'next/headers'
import { apiFetch } from '@/lib/backend'

export interface AlterarSenhaResult {
  ok: boolean
  erro?: 'senha_incorreta' | 'inativo' | 'nao_encontrado' | 'senha' | 'conexao'
}

export async function alterarSenha(
  senhaAtual: string,
  senhaNova: string,
): Promise<AlterarSenhaResult> {
  try {
    const res = await apiFetch('/alterar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAtual, senhaNova }),
    })

    if (res.ok) {
      // o back revoga o jti atual qnd a senha troca, entao essa sessao morreu.
      // limpa o cookie aqui pra n deixar o usuario com um token que ja era
      const cookieStore = await cookies()
      cookieStore.delete('session')
      return { ok: true }
    }

    const corpo = await res.json().catch(() => null)

    // 401 cobre dois casos com mensagens diferentes: senha atual errada e
    // vinculo inativo. da pra separar pelo texto que o service manda
    if (res.status === 401) {
      const mensagem = String(corpo?.message ?? '')
      return { ok: false, erro: mensagem.includes('inativo') ? 'inativo' : 'senha_incorreta' }
    }

    if (res.status === 404) {
      return { ok: false, erro: 'nao_encontrado' }
    }

    // 400 é a validacao do dto (min 8 / max 72), vem como array
    if (res.status === 400) {
      return { ok: false, erro: 'senha' }
    }

    return { ok: false, erro: 'conexao' }
  } catch {
    return { ok: false, erro: 'conexao' }
  }
}
