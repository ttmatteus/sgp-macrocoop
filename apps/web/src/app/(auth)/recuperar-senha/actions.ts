'use server'

import { getServerApiUrl } from '@/lib/backend'

export interface SolicitarResult {
  ok: boolean
  // modo dev: o back devolve o token na propria resposta, sem mandar email nenhum.
  // qnd o smtp existir isso some daqui e o token so chega no email do cooperado
  token?: string
  erro?: 'limite' | 'invalido' | 'conexao'
}

export async function solicitarRecuperacao(
  identificador: string,
): Promise<SolicitarResult> {
  const valor = identificador.trim()

  // o back tem um campo separado pra cada caso, mas a tela tem so um input.
  // decide pelo @ qual dos dois mandar
  const corpo = valor.includes('@') ? { email: valor } : { usuario: valor }

  try {
    const res = await fetch(`${getServerApiUrl()}/recuperar-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    })

    if (res.status === 429) {
      return { ok: false, erro: 'limite' }
    }

    if (!res.ok) {
      return { ok: false, erro: 'invalido' }
    }

    const dados = await res.json()
    return { ok: true, token: dados.token }
  } catch {
    return { ok: false, erro: 'conexao' }
  }
}

export interface ConfirmarResult {
  ok: boolean
  erro?: 'invalido' | 'expirado' | 'senha' | 'conexao'
}

export async function confirmarNovaSenha(
  token: string,
  senha: string,
): Promise<ConfirmarResult> {
  try {
    const res = await fetch(`${getServerApiUrl()}/redefinir-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, senha }),
    })

    if (res.ok) {
      return { ok: true }
    }

    // 410 = token expirou (passou dos 15min)
    if (res.status === 410) {
      return { ok: false, erro: 'expirado' }
    }

    if (res.status === 400) {
      // o back devolve 400 tanto pra token invalido qnt pra senha reprovada na
      // validacao, mas na senha o message vem como array (class-validator)
      const corpo = await res.json().catch(() => null)
      return {
        ok: false,
        erro: Array.isArray(corpo?.message) ? 'senha' : 'invalido',
      }
    }

    return { ok: false, erro: 'conexao' }
  } catch {
    return { ok: false, erro: 'conexao' }
  }
}
