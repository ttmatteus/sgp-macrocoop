'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  Smartphone,
  StickyNote,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CalendarioPopover } from './calendario-popover'
import { listarHistorico } from '@/app/(app)/historico/actions'
import {
  dataCurta,
  diaEmSaoPaulo,
  horaEmSaoPaulo,
  limitesDoMes,
  mesAnterior,
  mesAtualEmSaoPaulo,
  mesSeguinte,
  nomeDoMes,
  tituloDoDia,
} from '@/app/(app)/historico/datas'
import type { TurnoHistorico } from '@/app/(app)/historico/tipos'

const DIAS_POR_PAGINA = 5
// bate com as classes "duration-300" usadas no sheet la embaixo - tailwind
// so gera a classe se o valor aparecer literal no codigo, entao nao da pra
// interpolar essa constante direto numa arbitrary value tipo duration-[Xms]
const DURACAO_SHEET_MS = 300

interface DiaAgrupado {
  chave: string
  turnos: TurnoHistorico[]
}

function agruparPorDia(itens: TurnoHistorico[]): DiaAgrupado[] {
  const grupos = new Map<string, TurnoHistorico[]>()
  for (const t of itens) {
    const chave = diaEmSaoPaulo(t.iniciadoEm)
    grupos.set(chave, [...(grupos.get(chave) ?? []), t])
  }
  return [...grupos.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([chave, turnos]) => ({
      chave,
      turnos: [...turnos].sort((a, b) => a.iniciadoEm.localeCompare(b.iniciadoEm)),
    }))
}

// paginas a mostrar: sempre 1 e ultima, mais uma vizinhanca da atual, com
// "..." nos buracos - evita uma fileira gigante quando tem muita pagina
function paginasVisiveis(atual: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const paginas = new Set([1, total, atual - 1, atual, atual + 1])
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const resultado: (number | '...')[] = []
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - (ordenadas[i - 1] as number) > 1) resultado.push('...')
    resultado.push(p)
  })
  return resultado
}

// coluna de largura fixa pro dot + os pedacos de linha acima/abaixo dele:
// centraliza sozinho (flex items-center), sem depender de contar pixel de
// padding do container em volta pra bater com o tamanho do dot.
// quando "crescer" e passado, os pedacos de linha nascem com scaleY 0 e
// crescem a partir do dot (origin-bottom pro de cima, origin-top pro de
// baixo) no delayMs indicado - da o efeito de "desenhar" a trilha, nao
// so o dot/texto aparecendo. sem "crescer", a linha fica sempre no tamanho
// cheio (uso estatico, fora do sheet)
function TrilhaDot({
  cor,
  temAntes,
  temDepois,
  icone,
  crescer,
}: {
  cor: 'success' | 'destructive'
  temAntes: boolean
  temDepois: boolean
  icone?: React.ReactNode
  crescer?: { cheia: boolean; delayMs: number }
}) {
  const baseLinha = 'absolute h-1/2 w-px bg-border'
  const classeAnimada = crescer
    ? `transition-transform duration-300 ease-out ${crescer.cheia ? 'scale-y-100' : 'scale-y-0'}`
    : 'scale-y-100'
  const estiloLinha = crescer ? { transitionDelay: `${crescer.delayMs}ms` } : undefined

  return (
    <div className="relative flex w-[26px] shrink-0 flex-col items-center self-stretch">
      {temAntes && <span className={`${baseLinha} top-0 origin-bottom ${classeAnimada}`} style={estiloLinha} />}
      {temDepois && <span className={`${baseLinha} bottom-0 origin-top ${classeAnimada}`} style={estiloLinha} />}
      <span
        className={`relative z-10 flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 border-card ${
          cor === 'destructive' ? 'bg-destructive' : 'bg-success'
        }`}
      >
        {icone}
      </span>
    </div>
  )
}

export function HistoricoScreen({ ativo }: { ativo: boolean }) {
  const { ano: anoAtual, mes: mesAtualNumero } = mesAtualEmSaoPaulo()
  const [ano, setAno] = useState(anoAtual)
  const [mes, setMes] = useState(mesAtualNumero)
  const [pagina, setPagina] = useState(1)

  // dado fica montado durante a animacao de saida; sheetAberto so controla
  // a classe de transform/opacity. abre: monta com aberto=false, no proximo
  // frame vira true (senao o transform inicial nunca anima, ja nasce no lugar)
  const [diaParaMostrar, setDiaParaMostrar] = useState<DiaAgrupado | null>(null)
  const [sheetAberto, setSheetAberto] = useState(false)

  // esse painel entra na trilha do AppShell, que anima com transform - isso
  // cria containing block novo pra position:fixed, prendendo o sheet/backdrop
  // dentro da trilha em vez da tela toda. por isso o portal pra document.body
  // (mesma tecnica do dashboard-panel.tsx). document so existe no client
  const [montadoNoBody, setMontadoNoBody] = useState(false)
  useEffect(() => setMontadoNoBody(true), [])

  const abrirSheet = (dia: DiaAgrupado) => {
    setDiaParaMostrar(dia)
    requestAnimationFrame(() => requestAnimationFrame(() => setSheetAberto(true)))
  }
  const fecharSheet = () => {
    setSheetAberto(false)
    setTimeout(() => setDiaParaMostrar(null), DURACAO_SHEET_MS)
  }

  // Escape fecha, igual outros overlays do app
  useEffect(() => {
    if (!diaParaMostrar) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fecharSheet()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [diaParaMostrar])

  // periodo customizado (do calendario) tem prioridade sobre a navegacao de
  // mes simples. limpa sozinho quando volta a navegar por mes (trocarMes)
  const [filtroPersonalizado, setFiltroPersonalizado] = useState<{ inicio: string; fim: string } | null>(null)
  const [contratoFiltro, setContratoFiltro] = useState<number | null>(null)
  const [calendarioAberto, setCalendarioAberto] = useState(false)
  const [contratoDropdownAberto, setContratoDropdownAberto] = useState(false)
  const dropdownContratoRef = useRef<HTMLDivElement>(null)

  // fecha o dropdown de contrato ao clicar fora ou apertar Escape
  useEffect(() => {
    if (!contratoDropdownAberto) return
    const aoClicar = (e: MouseEvent) => {
      if (dropdownContratoRef.current && !dropdownContratoRef.current.contains(e.target as Node)) {
        setContratoDropdownAberto(false)
      }
    }
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContratoDropdownAberto(false)
    }
    document.addEventListener('mousedown', aoClicar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [contratoDropdownAberto])

  const { inicio, fim } = useMemo(
    () => filtroPersonalizado ?? limitesDoMes(ano, mes),
    [filtroPersonalizado, ano, mes],
  )

  const [itensDoMes, setItensDoMes] = useState<TurnoHistorico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [falhou, setFalhou] = useState(false)
  // incrementar isso e o gatilho do "tentar de novo"
  const [tentativa, setTentativa] = useState(0)

  // busca so quando a aba esta ativa: os 4 paineis da trilha ficam montados
  // o tempo todo, entao sem isso o historico buscaria no load do app inteiro
  useEffect(() => {
    if (!ativo) return

    let cancelado = false
    setCarregando(true)
    setFalhou(false)

    listarHistorico({
      inicio,
      fim,
      ...(contratoFiltro !== null ? { contratoId: contratoFiltro } : {}),
    }).then((resultado) => {
      if (cancelado) return
      if (!resultado.ok) {
        setFalhou(true)
        setItensDoMes([])
      } else {
        setItensDoMes(resultado.itens)
      }
      setCarregando(false)
    })

    // resposta antiga que chega depois de trocar de filtro nao sobrescreve
    // a atual
    return () => {
      cancelado = true
    }
  }, [ativo, inicio, fim, contratoFiltro, tentativa])

  // o filtro de contrato vem dos proprios turnos, entao ao filtrar por um
  // contrato a lista encolheria e nao daria pra voltar. por isso acumula:
  // contrato que ja apareceu uma vez continua na lista
  const [contratosVistos, setContratosVistos] = useState<Map<number, string>>(new Map())
  useEffect(() => {
    setContratosVistos((anterior) => {
      const mapa = new Map(anterior)
      let mudou = false
      for (const t of itensDoMes) {
        if (mapa.get(t.contratoId) !== t.contratoNome) {
          mapa.set(t.contratoId, t.contratoNome)
          mudou = true
        }
      }
      return mudou ? mapa : anterior
    })
  }, [itensDoMes])
  const contratosDisponiveis = useMemo(() => [...contratosVistos.entries()], [contratosVistos])

  const dias = useMemo(() => agruparPorDia(itensDoMes), [itensDoMes])
  const totalPaginas = Math.max(1, Math.ceil(dias.length / DIAS_POR_PAGINA))
  const diasDaPagina = dias.slice((pagina - 1) * DIAS_POR_PAGINA, pagina * DIAS_POR_PAGINA)

  // so os cards reanimam entrando (fade + sobe um pouco, escalonado) toda vez
  // que a pagina/filtro muda OU a aba fica ativa - o resto da tela (nav de
  // mes, filtro, paginacao) fica parado, nao precisa reanimar de novo.
  // "ativo" e essencial aqui: os 4 paineis da trilha ficam todos montados o
  // tempo todo (so deslizam via transform), entao sem isso a animacao ja
  // rodava (e acabava) no carregamento do app, fora de tela, antes do
  // usuario navegar ate essa aba.
  // useLayoutEffect (nao useEffect) pro reset pra "escondido" rodar antes do
  // navegador pintar - com useEffect ele pinta o card novo ja visivel (troca
  // de pagina = troca de key = elemento novo, nasce com o valor antigo de
  // cardsRevelados) e so DEPOIS esconde, dava um frame de "ja carregou tudo"
  const [cardsRevelados, setCardsRevelados] = useState(false)
  useLayoutEffect(() => {
    if (!ativo) return
    setCardsRevelados(false)
  }, [ativo, carregando, pagina, ano, mes, contratoFiltro, filtroPersonalizado])

  useEffect(() => {
    if (!ativo || carregando || cardsRevelados) return
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setCardsRevelados(true)))
    return () => cancelAnimationFrame(frame)
  }, [ativo, carregando, cardsRevelados, pagina, ano, mes, contratoFiltro, filtroPersonalizado])

  // filtro novo pode devolver menos dias que a pagina atual, ai a tela
  // ficaria vazia sem motivo aparente
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(1)
  }, [pagina, totalPaginas])

  const trocarMes = (proximo: { ano: number; mes: number }) => {
    setAno(proximo.ano)
    setMes(proximo.mes)
    setFiltroPersonalizado(null)
    setPagina(1)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
        <h1 className="text-base font-bold text-primary">Histórico de Ponto</h1>
        <button
          onClick={() => setCalendarioAberto(true)}
          aria-label="Escolher período no calendário"
          className={`flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted ${
            filtroPersonalizado ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <CalendarDays className="size-5" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 overflow-y-auto px-5 pb-24 pt-4">
        {/* periodo: navegacao de mes, ou o intervalo customizado do calendario */}
        <section className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          {filtroPersonalizado ? (
            <>
              <button
                onClick={() => setCalendarioAberto(true)}
                aria-label="Escolher período no calendário"
                className="rounded-lg px-2 py-1 text-sm font-bold text-foreground transition-colors hover:bg-muted"
              >
                {dataCurta(filtroPersonalizado.inicio)} — {dataCurta(filtroPersonalizado.fim)}
              </button>
              <button
                onClick={() => setFiltroPersonalizado(null)}
                aria-label="Limpar período customizado"
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => trocarMes(mesAnterior(ano, mes))}
                aria-label="Mês anterior"
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setCalendarioAberto(true)}
                aria-label="Escolher período no calendário"
                className="rounded-lg px-2 py-1 text-sm font-bold text-foreground transition-colors hover:bg-muted"
              >
                {nomeDoMes(mes)}, {ano}
              </button>
              <button
                onClick={() => trocarMes(mesSeguinte(ano, mes))}
                aria-label="Próximo mês"
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          )}
        </section>

        {/* filtro de contrato - so aparece se o cooperado ja teve turno em mais de 1.
            dropdown customizado (nao select nativo): o painel de opcoes do
            select nao segue os tokens do tema em todo navegador */}
        {contratosDisponiveis.length > 1 && (
          <div ref={dropdownContratoRef} className="relative">
            <button
              type="button"
              onClick={() => setContratoDropdownAberto((v) => !v)}
              className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/30"
            >
              <span className="truncate">
                {contratoFiltro
                  ? (contratosDisponiveis.find(([id]) => id === contratoFiltro)?.[1] ?? 'Todos os contratos')
                  : 'Todos os contratos'}
              </span>
              <ChevronDown
                className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  contratoDropdownAberto ? 'rotate-180' : ''
                }`}
              />
            </button>

            {contratoDropdownAberto && (
              <div className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
                <button
                  onClick={() => {
                    setContratoFiltro(null)
                    setPagina(1)
                    setContratoDropdownAberto(false)
                  }}
                  className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                    contratoFiltro === null ? 'font-semibold text-primary' : 'text-foreground'
                  }`}
                >
                  Todos os contratos
                </button>
                {contratosDisponiveis.map(([id, nome]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setContratoFiltro(id)
                      setPagina(1)
                      setContratoDropdownAberto(false)
                    }}
                    className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                      contratoFiltro === id ? 'font-semibold text-primary' : 'text-foreground'
                    }`}
                  >
                    {nome}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {carregando ? (
          // esqueleto no formato do card do dia, pra lista nao "pular" quando
          // o dado chega
          <div className="space-y-3" aria-busy="true" aria-label="Carregando turnos">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                </div>
                <div className="mt-4 h-3 w-40 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-32 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : falhou ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Clock className="size-7 text-muted-foreground" />
            </span>
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar o histórico.
            </p>
            <button
              onClick={() => setTentativa((t) => t + 1)}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Tentar de novo
            </button>
          </div>
        ) : dias.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Clock className="size-7 text-muted-foreground" />
            </span>
            <p className="text-sm text-muted-foreground">Nenhum turno registrado nesse período.</p>
          </div>
        ) : (
          <>
            {diasDaPagina.map((dia, i) => (
              <button
                key={dia.chave}
                onClick={() => abrirSheet(dia)}
                className={`w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-300 ease-out hover:bg-muted/40 ${
                  cardsRevelados ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                }`}
                style={{ transitionDelay: cardsRevelados ? `${i * 60}ms` : '0ms' }}
              >
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="text-sm font-semibold text-foreground">{tituloDoDia(dia.chave)}</h3>
                  <span className="text-xs text-muted-foreground">
                    {dia.turnos.length} {dia.turnos.length === 1 ? 'turno' : 'turnos'}
                  </span>
                </div>

                <div className="space-y-3">
                  {dia.turnos.map((t, j) => {
                    const emAtraso = t.status === 'atraso'
                    // desenha a timeline depois que o card ja "pousou": delay
                    // do card + um respiro + escalonado por linha
                    const delayLinha = i * 60 + 200 + j * 70
                    return (
                      <div
                        key={t.id}
                        className={`flex items-stretch gap-3 transition-all duration-300 ease-out ${
                          cardsRevelados ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                        }`}
                        style={{ transitionDelay: cardsRevelados ? `${delayLinha}ms` : '0ms' }}
                      >
                        <TrilhaDot
                          cor={emAtraso ? 'destructive' : 'success'}
                          temAntes={j > 0}
                          temDepois={j < dia.turnos.length - 1}
                          icone={<LogIn className="size-2.5 text-white" />}
                          crescer={{ cheia: cardsRevelados, delayMs: delayLinha }}
                        />
                        <div className="flex flex-1 flex-col gap-1.5 py-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm text-foreground">Entrada</span>
                              <span className="font-mono text-xs text-muted-foreground">
                                {horaEmSaoPaulo(t.iniciadoEm)}
                              </span>
                            </div>
                            <Badge variant={emAtraso ? 'error' : 'success'}>
                              {emAtraso ? 'Atraso' : 'No horário'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <LogOut className="size-3.5 shrink-0" />
                            <span className="text-sm text-foreground">Saída</span>
                            <span className="font-mono text-xs">{horaEmSaoPaulo(t.encerradoEm)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </button>
            ))}

            {/* paginacao */}
            <div className="flex items-center justify-center gap-1.5 pt-2 pb-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                aria-label="Página anterior"
                className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
                p === '...' ? (
                  <span key={`gap-${i}`} className="px-1 text-sm text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className={`flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === pagina
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                aria-label="Próxima página"
                className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </>
        )}
      </main>

      {/* bottom sheet de detalhes do dia - fica montado durante a animacao
          de saida, so troca a classe (ver abrirSheet/fecharSheet). portal
          pra document.body pra escapar do transform da trilha (ver useEffect
          do montadoNoBody, e o comentario junto dele) */}
      {montadoNoBody &&
        diaParaMostrar &&
        createPortal(
          <>
          <div
            onClick={fecharSheet}
            className={`fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 ${
              sheetAberto ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl bg-card pb-8 shadow-2xl transition-transform duration-300 ease-out ${
              sheetAberto ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="flex w-full justify-center pt-3 pb-2">
              <div className="h-1.5 w-12 rounded-full bg-border" />
            </div>

            <div className="flex items-start justify-between border-b border-border px-5 pb-4">
              <div>
                <h2 className="text-base font-bold text-primary">Detalhes do Registro</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="size-4" />
                  {tituloDoDia(diaParaMostrar.chave)}
                </p>
              </div>
              <button
                onClick={fecharSheet}
                aria-label="Fechar"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Histórico do dia
              </h3>
              <div className="space-y-1">
                {diaParaMostrar.turnos.flatMap((t, i) => {
                  const emAtraso = t.status === 'atraso'
                  const totalPontos = diaParaMostrar.turnos.length * 2
                  const indiceEntrada = i * 2
                  const delayEntrada = 120 + indiceEntrada * 60
                  const delaySaida = 120 + (indiceEntrada + 1) * 60
                  return [
                    <div
                      key={`${t.id}-entrada`}
                      className={`flex items-stretch gap-3 transition-all duration-300 ease-out ${
                        sheetAberto ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                      }`}
                      style={{ transitionDelay: sheetAberto ? `${delayEntrada}ms` : '0ms' }}
                    >
                      <TrilhaDot
                        cor={emAtraso ? 'destructive' : 'success'}
                        temAntes={indiceEntrada > 0}
                        temDepois
                        crescer={{ cheia: sheetAberto, delayMs: delayEntrada }}
                      />
                      <div className="flex flex-1 items-start justify-between gap-2 pb-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Entrada</p>
                          <p className="text-sm text-muted-foreground">{horaEmSaoPaulo(t.iniciadoEm)}</p>
                        </div>
                        <Badge variant={emAtraso ? 'error' : 'success'}>
                          {emAtraso ? 'Atraso' : 'No horário'}
                        </Badge>
                      </div>
                    </div>,
                    <div
                      key={`${t.id}-saida`}
                      className={`flex items-stretch gap-3 transition-all duration-300 ease-out ${
                        sheetAberto ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
                      }`}
                      style={{ transitionDelay: sheetAberto ? `${delaySaida}ms` : '0ms' }}
                    >
                      <TrilhaDot
                        cor="success"
                        temAntes
                        temDepois={indiceEntrada + 1 < totalPontos - 1}
                        crescer={{ cheia: sheetAberto, delayMs: delaySaida }}
                      />
                      <div className="flex flex-1 items-start justify-between gap-2 pb-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">Saída</p>
                          <p className="text-sm text-muted-foreground">{horaEmSaoPaulo(t.encerradoEm)}</p>
                        </div>
                        <Badge variant="success">No horário</Badge>
                      </div>
                    </div>,
                  ]
                })}
              </div>

              {/* TODO: so cosmetico - a api ainda nao devolve localizacao/
                  dispositivo/observacao por registro, so o turno completo */}
              <div className="mt-4 space-y-2.5 rounded-xl bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Localização</p>
                    <p className="text-sm text-foreground">{diaParaMostrar.turnos[0]?.contratoNome}</p>
                  </div>
                </div>
                <div className="h-px w-full bg-border" />
                <div className="flex items-start gap-3">
                  <Smartphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Dispositivo</p>
                    <p className="text-sm text-foreground">App (celular)</p>
                  </div>
                </div>
                <div className="h-px w-full bg-border" />
                <div className="flex items-start gap-3">
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Observação</p>
                    <p className="text-sm italic text-muted-foreground">Nenhuma</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pt-2">
              <button
                onClick={fecharSheet}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
              >
                Fechar
              </button>
            </div>
          </div>
          </>,
          document.body,
        )}

      <CalendarioPopover
        aberto={calendarioAberto}
        anoInicial={ano}
        mesInicial={mes}
        onFechar={() => setCalendarioAberto(false)}
        onAplicar={(intervalo) => {
          setFiltroPersonalizado(intervalo)
          setPagina(1)
          setCalendarioAberto(false)
        }}
        onLimpar={() => {
          setFiltroPersonalizado(null)
          setPagina(1)
        }}
      />
    </div>
  )
}
