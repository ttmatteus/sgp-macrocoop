'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { MousePointer2, X } from 'lucide-react'
import { pctLeft, pctTop, spawnRippleOn } from './cursor-demo-utils'

const DIAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
// grade fixa/fake (nao e um mes de verdade, e so uma maquete pro tutorial):
// 3 celulas vazias de offset + dias 1 a 30 pra fechar 5 linhas de 7
const CELULAS_FAKE = [null, null, null, ...Array.from({ length: 30 }, (_, i) => i + 1)]
const DIA_INICIO_DEMO = 8
const DIA_FIM_DEMO = 13

interface Props {
  aberto: boolean
  onFechar: () => void
}

// modal separado com uma maquete (nao a tela real) do calendario, so pra
// demonstrar o fluxo com um cursor fake - mesmo padrao da hero do ds-sgp
// (components/docs/hero-phone-preview.tsx). fica em loop enquanto aberto,
// igual a hero: e conteudo passivo, o usuario so ta assistindo
export function TutorialCalendarioModal({ aberto, onFechar }: Props) {
  const [montadoNoBody, setMontadoNoBody] = useState(false)
  useEffect(() => setMontadoNoBody(true), [])

  const [marcadoInicio, setMarcadoInicio] = useState(false)
  const [marcadoFim, setMarcadoFim] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const aplicarRef = useRef<HTMLDivElement>(null)
  const diasRef = useRef<Record<number, HTMLButtonElement | null>>({})
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!aberto) {
      tlRef.current?.kill()
      return
    }

    const card = cardRef.current
    const cursor = cursorRef.current
    const diaInicioEl = diasRef.current[DIA_INICIO_DEMO]
    const diaFimEl = diasRef.current[DIA_FIM_DEMO]
    const botaoAplicar = aplicarRef.current
    if (!card || !cursor || !diaInicioEl || !diaFimEl || !botaoAplicar) return

    setMarcadoInicio(false)
    setMarcadoFim(false)

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, delay: 0.4 })
    tlRef.current = tl

    tl.set(cursor, { opacity: 0, top: '4%', left: '85%', scale: 1 })
      .call(() => {
        setMarcadoInicio(false)
        setMarcadoFim(false)
      })
      .to(cursor, { opacity: 1, duration: 0.3, ease: 'power1.out' })
      // clica no dia de inicio
      .to(cursor, {
        top: () => pctTop(card, diaInicioEl),
        left: () => pctLeft(card, diaInicioEl),
        duration: 0.7,
        ease: 'power2.inOut',
      })
      .to(cursor, { scale: 0.85, duration: 0.1, ease: 'power1.out' }, '+=0.1')
      .call(() => {
        spawnRippleOn(diaInicioEl, 'var(--primary)')
        setMarcadoInicio(true)
      })
      .to(cursor, { scale: 1, duration: 0.15, ease: 'power1.out' })
      // clica no dia de fim
      .to(
        cursor,
        {
          top: () => pctTop(card, diaFimEl),
          left: () => pctLeft(card, diaFimEl),
          duration: 0.55,
          ease: 'power2.inOut',
        },
        '+=0.35',
      )
      .to(cursor, { scale: 0.85, duration: 0.1, ease: 'power1.out' }, '+=0.1')
      .call(() => {
        spawnRippleOn(diaFimEl, 'var(--primary)')
        setMarcadoFim(true)
      })
      .to(cursor, { scale: 1, duration: 0.15, ease: 'power1.out' })
      // clica em aplicar
      .to(
        cursor,
        {
          top: () => pctTop(card, botaoAplicar),
          left: () => pctLeft(card, botaoAplicar),
          duration: 0.55,
          ease: 'power2.inOut',
        },
        '+=0.35',
      )
      .to(cursor, { scale: 0.85, duration: 0.1, ease: 'power1.out' }, '+=0.1')
      .call(() => spawnRippleOn(botaoAplicar, 'var(--primary-foreground)'))
      .to(cursor, { scale: 1, duration: 0.15, ease: 'power1.out' })
      .to(cursor, { opacity: 0, duration: 0.25 }, '+=0.6')

    return () => {
      tl.kill()
    }
  }, [aberto])

  if (!montadoNoBody || !aberto) return null

  return createPortal(
    <>
      <div onClick={onFechar} className="fixed inset-0 z-[80] bg-foreground/50 backdrop-blur-sm" />
      <div className="fixed inset-x-6 top-1/2 z-[80] -translate-y-1/2 rounded-2xl bg-card p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Como escolher um período</h3>
          <button
            onClick={onFechar}
            aria-label="Fechar tutorial"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Toque um dia pra marcar o início, toque outro pra marcar o fim, e depois toque em{' '}
          <span className="font-semibold text-foreground">Aplicar</span>.
        </p>

        {/* maquete (nao interativa) do calendario, so pra o cursor fake demonstrar */}
        <div ref={cardRef} className="relative rounded-xl border border-border bg-muted/30 p-3">
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {CELULAS_FAKE.map((dia, i) => {
              if (dia === null) return <span key={`vazio-${i}`} />
              const noInicio = dia === DIA_INICIO_DEMO && marcadoInicio
              const noFim = dia === DIA_FIM_DEMO && marcadoFim
              const noIntervalo = marcadoInicio && marcadoFim && dia > DIA_INICIO_DEMO && dia < DIA_FIM_DEMO
              return (
                <button
                  key={dia}
                  ref={(el) => {
                    diasRef.current[dia] = el
                  }}
                  tabIndex={-1}
                  className={`pointer-events-none relative flex h-7 items-center justify-center rounded-full text-xs transition-colors duration-200 ${
                    noInicio || noFim
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : noIntervalo
                        ? 'bg-primary/15 text-foreground'
                        : 'text-foreground'
                  }`}
                >
                  {dia}
                </button>
              )
            })}
          </div>

          <div
            ref={aplicarRef}
            className="pointer-events-none relative mt-3 flex items-center justify-center rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground"
          >
            Aplicar
          </div>

          <div ref={cursorRef} className="pointer-events-none absolute z-20 drop-shadow-md" style={{ opacity: 0 }}>
            <MousePointer2 className="size-4 fill-foreground text-foreground" />
          </div>
        </div>

        <button
          onClick={onFechar}
          className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Entendi
        </button>
      </div>
    </>,
    document.body,
  )
}
