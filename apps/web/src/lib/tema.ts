'use client'

import { useCallback, useEffect, useState } from 'react'

export type PreferenciaTema = 'auto' | 'claro' | 'escuro'

export const CHAVE_TEMA = 'sgp:tema'

// janela noturna: cobre o turno de noite (18h às 6h)
export function horarioNoturno(agora = new Date()): boolean {
  const hora = agora.getHours()
  return hora >= 18 || hora < 6
}

export function aplicarTema(preferencia: PreferenciaTema): void {
  const escuro =
    preferencia === 'escuro' || (preferencia === 'auto' && horarioNoturno())
  document.documentElement.classList.toggle('dark', escuro)
}

export function obterPreferencia(): PreferenciaTema {
  if (typeof window === 'undefined') return 'auto'
  const salvo = window.localStorage.getItem(CHAVE_TEMA)
  return salvo === 'claro' || salvo === 'escuro' ? salvo : 'auto'
}

export function usarTema() {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>('auto')

  useEffect(() => {
    setPreferencia(obterPreferencia())
    aplicarTema(obterPreferencia())
  }, [])

  // no modo auto reavalia a cada minuto (pega a virada 18h/6h sem recarregar)
  useEffect(() => {
    if (preferencia !== 'auto') return
    const id = setInterval(() => aplicarTema('auto'), 60_000)
    return () => clearInterval(id)
  }, [preferencia])

  const definir = useCallback((proxima: PreferenciaTema) => {
    setPreferencia(proxima)
    window.localStorage.setItem(CHAVE_TEMA, proxima)
    aplicarTema(proxima)
  }, [])

  return { preferencia, definir }
}