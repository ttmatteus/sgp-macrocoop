export interface TurnoHistorico {
  id: number
  contratoId: number
  contratoNome: string
  iniciadoEm: string
  encerradoEm: string
  status: string
}

export interface HistoricoTurnos {
  itens: TurnoHistorico[]
  total: number
  pagina: number
  limite: number
}

export interface FiltrosHistorico {
  inicio?: string
  fim?: string
  contratoId?: number
  pagina?: number
  limite?: number
}
