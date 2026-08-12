'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronLeft, ChevronRight, HelpCircle, X } from 'lucide-react'
import {
  chaveDia,
  diaDaSemanaDoPrimeiro,
  diasNoMes,
  mesAnterior,
  mesSeguinte,
  nomeDoMes,
} from '@/app/(app)/historico/datas'
import { TutorialCalendarioModal } from './tutorial-calendario-modal'

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

interface Props {
  aberto: boolean
  anoInicial: number
  mesInicial: number
  onFechar: () => void
  onAplicar: (intervalo: { inicio: string; fim: string }) => void
  onLimpar: () => void
}

// calendario customizado (nao tem lib de data no projeto): grade do mes,
// clica um dia pra marcar o inicio, clica outro pra marcar o fim do
// intervalo. portal pra document.body pelo msm motivo do sheet (ver
// historico-screen.tsx): a trilha do AppShell anima com transform, que
// prende position:fixed dentro dela se nao escapar
export function CalendarioPopover({ aberto, anoInicial, mesInicial, onFechar, onAplicar, onLimpar }: Props) {
  const [montadoNoBody, setMontadoNoBody] = useState(false)
  useEffect(() => setMontadoNoBody(true), [])

  const [ano, setAno] = useState(anoInicial)
  const [mes, setMes] = useState(mesInicial)
  const [selInicio, setSelInicio] = useState<string | null>(null)
  const [selFim, setSelFim] = useState<string | null>(null)
  const [anoDropdownAberto, setAnoDropdownAberto] = useState(false)
  const [tutorialAberto, setTutorialAberto] = useState(false)
  const dropdownAnoRef = useRef<HTMLDivElement>(null)

  // toda vez que abre, comeca a navegacao do mes de onde a tela ta e limpa
  // a selecao anterior - assim n fica com resto de uma escolha de outra hora
  useEffect(() => {
    if (!aberto) return
    setAno(anoInicial)
    setMes(mesInicial)
    setSelInicio(null)
    setSelFim(null)
    setAnoDropdownAberto(false)
    setTutorialAberto(false)
  }, [aberto, anoInicial, mesInicial])

  // fecha o dropdown de ano ao clicar fora ou apertar Escape
  useEffect(() => {
    if (!anoDropdownAberto) return
    const aoClicar = (e: MouseEvent) => {
      if (dropdownAnoRef.current && !dropdownAnoRef.current.contains(e.target as Node)) {
        setAnoDropdownAberto(false)
      }
    }
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAnoDropdownAberto(false)
    }
    document.addEventListener('mousedown', aoClicar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [anoDropdownAberto])

  if (!montadoNoBody || !aberto) return null

  // anos pra escolher no dropdown: uns anos pra tras a partir de hoje, mais
  // o ano que ta selecionado agora (caso seja mais antigo que esse intervalo)
  const anoRealAtual = new Date().getFullYear()
  const anosDisponiveis = [...new Set([ano, ...Array.from({ length: 7 }, (_, i) => anoRealAtual - i)])].sort(
    (a, b) => b - a,
  )

  const clicarDia = (chave: string) => {
    if (!selInicio || (selInicio && selFim)) {
      setSelInicio(chave)
      setSelFim(null)
      return
    }
    if (chave < selInicio) {
      setSelFim(selInicio)
      setSelInicio(chave)
    } else {
      setSelFim(chave)
    }
  }

  const aplicar = () => {
    if (!selInicio) return
    onAplicar({ inicio: selInicio, fim: selFim ?? selInicio })
  }

  const offset = diaDaSemanaDoPrimeiro(ano, mes)
  const totalDias = diasNoMes(ano, mes)
  const celulas: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDias }, (_, i) => chaveDia(ano, mes, i + 1)),
  ]

  return createPortal(
    <>
      <div onClick={onFechar} className="fixed inset-0 z-[70] bg-foreground/40 backdrop-blur-sm" />
      <div className="fixed inset-x-6 top-1/2 z-[70] -translate-y-1/2 rounded-2xl bg-card p-4 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Selecione o período</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTutorialAberto(true)}
              aria-label="Ver tutorial rápido"
              title="Ver tutorial rápido"
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            >
              <HelpCircle className="size-4" />
            </button>
            <button
              onClick={onFechar}
              aria-label="Fechar calendário"
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-center gap-2">
          <button
            onClick={() => {
              const p = mesAnterior(ano, mes)
              setAno(p.ano)
              setMes(p.mes)
            }}
            aria-label="Mês anterior"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h4 className="min-w-[72px] text-center text-sm font-semibold text-foreground">{nomeDoMes(mes)}</h4>
          <button
            onClick={() => {
              const p = mesSeguinte(ano, mes)
              setAno(p.ano)
              setMes(p.mes)
            }}
            aria-label="Próximo mês"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronRight className="size-4" />
          </button>

          <div ref={dropdownAnoRef} className="relative ml-1">
            <button
              onClick={() => setAnoDropdownAberto((v) => !v)}
              aria-label="Escolher ano"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {ano}
              <ChevronDown
                className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
                  anoDropdownAberto ? 'rotate-180' : ''
                }`}
              />
            </button>
            {anoDropdownAberto && (
              <div className="absolute right-0 z-10 mt-1 max-h-48 w-24 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg">
                {anosDisponiveis.map((a) => (
                  <button
                    key={a}
                    onClick={() => {
                      setAno(a)
                      setAnoDropdownAberto(false)
                    }}
                    className={`flex w-full items-center justify-center px-3 py-1.5 text-sm transition-colors hover:bg-muted ${
                      a === ano ? 'font-semibold text-primary' : 'text-foreground'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
          {DIAS_SEMANA.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celulas.map((chave, i) => {
            if (!chave) return <span key={`vazio-${i}`} />
            const noInicio = chave === selInicio
            const noFim = chave === selFim
            const noIntervalo = !!selInicio && !!selFim && chave > selInicio && chave < selFim
            const dia = Number(chave.split('-')[2])
            return (
              <button
                key={chave}
                onClick={() => clicarDia(chave)}
                className={`flex h-8 items-center justify-center rounded-full text-sm transition-colors ${
                  noInicio || noFim
                    ? 'bg-primary font-semibold text-primary-foreground'
                    : noIntervalo
                      ? 'bg-primary/15 text-foreground'
                      : 'text-foreground hover:bg-muted'
                }`}
              >
                {dia}
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              onLimpar()
              onFechar()
            }}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Limpar
          </button>
          <button
            onClick={aplicar}
            disabled={!selInicio}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      </div>

      <TutorialCalendarioModal aberto={tutorialAberto} onFechar={() => setTutorialAberto(false)} />
    </>,
    document.body,
  )
}
