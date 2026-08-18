'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

const CHAVE_DISPENSADO = 'gdc:pwa-banner-dispensado'

type Plataforma = 'ios' | 'android' | 'outro'

function detectarPlataforma(): Plataforma {
  const ua = window.navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'outro'
}

// gate padrao do repo (ver DashboardPanel/CalendarioPopover): so le
// sessionStorage/matchMedia/UA depois de montar no client, senao o
// hidratacao do server (sem window) diverge do client
export function usarInstalarPwa() {
  const [montado, setMontado] = useState(false)
  const [plataforma, setPlataforma] = useState<Plataforma>('outro')
  const [jaInstalado, setJaInstalado] = useState(false)
  const [dispensado, setDispensado] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    setMontado(true)

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setJaInstalado(standalone)
    // iPadOS 13+ se identifica como Mac no UA (nao coberto aqui, edge case
    // conhecido - nao bloqueia o resto, so nao ganha a instrucao de iOS)
    setPlataforma(detectarPlataforma())
    setDispensado(window.sessionStorage.getItem(CHAVE_DISPENSADO) === '1')

    const aoTerBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const aoInstalar = () => {
      setJaInstalado(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', aoTerBeforeInstall)
    window.addEventListener('appinstalled', aoInstalar)
    return () => {
      window.removeEventListener('beforeinstallprompt', aoTerBeforeInstall)
      window.removeEventListener('appinstalled', aoInstalar)
    }
  }, [])

  const instalarAndroid = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (outcome === 'accepted') setJaInstalado(true)
  }

  const dispensar = () => {
    window.sessionStorage.setItem(CHAVE_DISPENSADO, '1')
    setDispensado(true)
  }

  const deveMostrar =
    montado &&
    !jaInstalado &&
    !dispensado &&
    (plataforma === 'ios' || (plataforma === 'android' && deferredPrompt !== null))

  return { deveMostrar, plataforma, instalarAndroid, dispensar }
}
