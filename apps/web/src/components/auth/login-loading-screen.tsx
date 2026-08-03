'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

// msgs fake só p/ dar sensação de progresso, n reflete nada real do back ainda
const etapas = ['Verificando credenciais...', 'Carregando seu painel...', 'Quase lá...']

export function LoginLoadingScreen() {
  const [status, setStatus] = useState(etapas[0])
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timers = [
      setTimeout(() => setStatus(etapas[1]), 900),
      setTimeout(() => setStatus(etapas[2]), 1800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (!logoRef.current) return
    const tween = gsap.to(logoRef.current, {
      scale: 1.08,
      duration: 0.85,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    })
    return () => {
      tween.kill()
    }
  }, [])

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-primary text-primary-foreground">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div ref={logoRef} className="text-4xl font-extrabold tracking-tight">
          SGP
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/70 [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/70 [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary-foreground/70" />
        </div>
        <p className="text-sm text-primary-foreground/80">{status}</p>
      </div>

      {/* Wave orgânica decorativa no rodapé */}
      <svg
        aria-hidden
        viewBox="0 0 380 80"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-primary-foreground/10"
        fill="currentColor"
      >
        <path d="M0,80 L0,50 C40,50 70,10 130,10 C180,10 200,45 250,45 C300,45 330,15 380,15 L380,80 Z" />
      </svg>
    </div>
  )
}
