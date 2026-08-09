'use client'

import type { DadosRegistro } from '@/app/(app)/ponto/tipos'

const CHAVE = 'sgp:ponto:fila'

/**
 * Fila local de batidas que nao conseguiram subir. Cada item ja carrega o
 * idCliente gerado na hora da batida, entao reenviar e idempotente do lado da
 * API: a mesma batida reenviada volta 200 com o registro original.
 */
export function lerFila(): DadosRegistro[] {
  if (typeof window === 'undefined') return []
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as DadosRegistro[]) : []
  } catch {
    return []
  }
}

function gravarFila(itens: DadosRegistro[]) {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(itens))
  } catch {
    // storage cheio ou bloqueado: nao da pra enfileirar, mas nao derruba a tela
  }
}

export function enfileirar(item: DadosRegistro) {
  const fila = lerFila()
  if (fila.some((i) => i.idCliente === item.idCliente)) return
  gravarFila([...fila, item])
}

export function remover(idCliente: string) {
  gravarFila(lerFila().filter((i) => i.idCliente !== idCliente))
}

export function limpar() {
  gravarFila([])
}
