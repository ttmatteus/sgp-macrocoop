'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { LoginPanel } from '@/components/auth/login-panel'
import { RecuperarSenhaPanel } from '@/components/auth/recuperar-senha-panel'

export default function AuthLayout() {
  const pathname = usePathname()
  const trackRef = useRef<HTMLDivElement>(null)
  const montouRef = useRef(false)

  const tela: 'login' | 'recuperar-senha' =
    pathname === '/recuperar-senha' ? 'recuperar-senha' : 'login'

  // mesma trilha deslizante do perfil/ajustes, só que entre login e recuperar senha
  useEffect(() => {
    if (!trackRef.current) return
    const xPercent = tela === 'login' ? 0 : -50

    if (!montouRef.current) {
      montouRef.current = true
      gsap.set(trackRef.current, { xPercent })
      return
    }

    gsap.to(trackRef.current, {
      xPercent,
      duration: 0.5,
      ease: 'power2.inOut',
    })
  }, [tela])

  return (
    <div className="relative h-dvh overflow-hidden bg-background">
      <div ref={trackRef} className="flex h-full w-[200%]">
        <div className="h-full w-1/2 shrink-0">
          <LoginPanel />
        </div>
        <div className="h-full w-1/2 shrink-0">
          <RecuperarSenhaPanel />
        </div>
      </div>
    </div>
  )
}
