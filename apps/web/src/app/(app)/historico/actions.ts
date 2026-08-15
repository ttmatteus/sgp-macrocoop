'use server'

import { apiFetch } from '@/lib/backend'
import type { FiltrosHistorico, HistoricoTurnos, TurnoHistorico } from './tipos'

export type HistoricoResult =
  | { ok: true; itens: TurnoHistorico[] }
  | { ok: false }

// maximo aceito pelo @Max(100) do dto da api
const LIMITE_POR_PAGINA = 100
// trava de seguranca: com 100 por pagina isso ja e mais turno do que um
// cooperado faz em um ano, e evita loop infinito se a api devolver um
// total inconsistente
const MAXIMO_DE_PAGINAS = 12

function montarQuery(filtros: FiltrosHistorico): string {
  const params = new URLSearchParams()
  if (filtros.inicio) params.set('inicio', filtros.inicio)
  if (filtros.fim) params.set('fim', filtros.fim)
  if (filtros.contratoId !== undefined) params.set('contratoId', String(filtros.contratoId))
  if (filtros.pagina !== undefined) params.set('pagina', String(filtros.pagina))
  if (filtros.limite !== undefined) params.set('limite', String(filtros.limite))
  return params.toString()
}

async function buscarPagina(
  filtros: FiltrosHistorico,
  pagina: number,
): Promise<HistoricoTurnos | null> {
  const query = montarQuery({ ...filtros, pagina, limite: LIMITE_POR_PAGINA })
  const res = await apiFetch(`/turnos/historico?${query}`)
  if (!res.ok) return null
  return res.json()
}

// a tela agrupa por dia e pagina de 5 em 5 dias, enquanto a api pagina por
// turno. entao aqui busca o periodo inteiro e deixa o recorte por dia pro
// cliente. quase sempre e uma requisicao so: um mes de turnos de um
// cooperado nao chega perto de 100
export async function listarHistorico(filtros: FiltrosHistorico): Promise<HistoricoResult> {
  try {
    const primeira = await buscarPagina(filtros, 1)
    if (!primeira) return { ok: false }

    const itens = [...primeira.itens]
    const totalDePaginas = Math.min(
      Math.ceil(primeira.total / LIMITE_POR_PAGINA),
      MAXIMO_DE_PAGINAS,
    )

    for (let pagina = 2; pagina <= totalDePaginas; pagina++) {
      const proxima = await buscarPagina(filtros, pagina)
      if (!proxima) break
      itens.push(...proxima.itens)
    }

    return { ok: true, itens }
  } catch {
    return { ok: false }
  }
}
