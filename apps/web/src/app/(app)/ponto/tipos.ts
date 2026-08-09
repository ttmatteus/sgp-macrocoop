export interface LocalPonto {
  id: number
  nome: string
  latitude: string
  longitude: string
  raioM: number
}

export interface ContratoDisponivel {
  id: number
  nome: string
  codigo: string
  locais: LocalPonto[]
}

export interface TurnoAberto {
  id: number
  contratoId: number
  contratoNome: string
  iniciadoEm: string
}

export interface RegistroPonto {
  id: number
  tipo: string
  registradoEm: string
  statusLocalizacao: string | null
  distanciaContratoM: string | null
  turnoId: number | null
}

export type ErroRegistro =
  | 'sem-alocacao'
  | 'turno-aberto'
  | 'sem-turno'
  | 'contrato-errado'
  | 'data-invalida'
  | 'conexao'

export interface ContratosResult {
  ok: boolean
  contratos?: ContratoDisponivel[]
  erro?: 'conexao'
}

export interface RegistrarResult {
  ok: boolean
  registro?: RegistroPonto
  /** false = reenvio idempotente, o registro ja existia (HTTP 200 em vez de 201) */
  criado?: boolean
  erro?: ErroRegistro
  mensagem?: string
}

export interface DadosRegistro {
  idCliente: string
  contratoId: number
  tipo: 'entrada' | 'saida'
  registradoEm: string
  latitude: number
  longitude: number
  precisaoM: number
}
