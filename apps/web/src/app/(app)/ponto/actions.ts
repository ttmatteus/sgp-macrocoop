'use server'

import { apiFetch } from '@/lib/backend'
import type {
  ContratosResult,
  DadosRegistro,
  ErroRegistro,
  RegistrarResult,
  TurnoAberto,
} from './tipos'

export async function listarContratosDisponiveis(): Promise<ContratosResult> {
  try {
    const res = await apiFetch('/turnos/contratos-disponiveis')
    if (!res.ok) {
      return { ok: false, erro: 'conexao' }
    }
    return { ok: true, contratos: await res.json() }
  } catch {
    return { ok: false, erro: 'conexao' }
  }
}

/** null = sem turno aberto (a API responde 204), que e estado normal */
export async function buscarTurnoAberto(): Promise<TurnoAberto | null> {
  try {
    const res = await apiFetch('/turnos/aberto')
    if (res.status === 204 || !res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function classificarErro(status: number, mensagem: string): ErroRegistro {
  if (status === 422) {
    return mensagem.includes('alocação') ? 'sem-alocacao' : 'data-invalida'
  }
  if (status === 409) {
    if (mensagem.includes('outro contrato')) return 'contrato-errado'
    if (mensagem.includes('encerrar')) return 'sem-turno'
    return 'turno-aberto'
  }
  return 'conexao'
}

// dev only: limpa turno + registros do usuario logado, pra retestar o fluxo do zero
export async function resetDev(): Promise<boolean> {
  try {
    const res = await apiFetch('/turnos/dev/reset', { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}

export async function registrarPonto(dados: DadosRegistro): Promise<RegistrarResult> {
  try {
    const res = await apiFetch('/turnos/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    })

    const corpo = await res.json().catch(() => null)

    if (!res.ok) {
      const mensagem = String(corpo?.message ?? '')
      return { ok: false, erro: classificarErro(res.status, mensagem), mensagem }
    }

    // 201 = batida nova, 200 = reenvio do mesmo idCliente ja processado antes
    return { ok: true, registro: corpo, criado: res.status === 201 }
  } catch {
    return { ok: false, erro: 'conexao' }
  }
}
