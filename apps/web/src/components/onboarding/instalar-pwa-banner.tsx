'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Share, X } from 'lucide-react'
import { usarInstalarPwa } from './usar-instalar-pwa'

// mesmo padrao do bottom sheet do historico: duracao literal (Tailwind nao
// interpola arbitrary value vindo de variavel), estado de "renderizado"
// separado do de "visivel" pra dar tempo da transicao de saida rodar antes
// de desmontar
const DURACAO_MS = 300

export function InstalarPwaBanner() {
  const { deveMostrar, plataforma, instalarAndroid, dispensar } = usarInstalarPwa()
  const [renderizado, setRenderizado] = useState(false)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (!deveMostrar) {
      setVisivel(false)
      return undefined
    }
    setRenderizado(true)
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setVisivel(true)))
    return () => cancelAnimationFrame(frame)
  }, [deveMostrar])

  useEffect(() => {
    if (visivel || !renderizado) return
    const timer = setTimeout(() => setRenderizado(false), DURACAO_MS)
    return () => clearTimeout(timer)
  }, [visivel, renderizado])

  if (!renderizado) return null

  return (
    <div
      role="dialog"
      aria-label="Instalar o app"
      className={`fixed inset-x-4 top-4 z-30 overflow-hidden rounded-2xl border border-border bg-card shadow-xl transition-all duration-300 ease-out ${
        visivel ? 'translate-y-0 opacity-100' : '-translate-y-[calc(100%+2rem)] opacity-0'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-xl shadow-sm"
        />

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold leading-tight text-foreground">Instalar o GDC</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {plataforma === 'android'
              ? 'Acesse direto da tela de início, sem abrir o navegador.'
              : 'Toque em Compartilhar e depois em "Adicionar à Tela de Início".'}
          </p>
        </div>

        <button
          onClick={dispensar}
          aria-label="Dispensar"
          className="-mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {plataforma === 'android' ? (
        <div className="px-4 pb-4">
          <button
            onClick={() => void instalarAndroid()}
            className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px"
          >
            Instalar
          </button>
        </div>
      ) : (
        // no ios nao da pra disparar a instalacao por api, entao em vez de
        // botao mostra o icone que a pessoa tem que procurar na barra do safari
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <Share className="size-4 shrink-0 text-primary" />
          <span className="text-xs text-muted-foreground">
            Fica na barra de baixo do Safari
          </span>
        </div>
      )}
    </div>
  )
}
