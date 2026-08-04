'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { ArrowLeft, Lock } from 'lucide-react'
import { SplashButton } from '@/components/ui/splash-button'

export default function AlterarSenhaPage() {
  const router = useRouter()
  const frameRef = useRef<HTMLDivElement>(null)
  const splashRef = useRef<HTMLDivElement>(null)

  const handleVoltar = (e: React.MouseEvent) => {
    const frame = frameRef.current
    const splash = splashRef.current
    if (!frame || !splash) {
      router.push('/perfil/ajustes')
      return
    }

    const rect = frame.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    const maxX = Math.max(clickX, rect.width - clickX)
    const maxY = Math.max(clickY, rect.height - clickY)
    const radius = Math.sqrt(maxX ** 2 + maxY ** 2)

    splash.style.width = `${radius * 2}px`
    splash.style.height = `${radius * 2}px`
    splash.style.left = `${clickX - radius}px`
    splash.style.top = `${clickY - radius}px`

    gsap.set(splash, { scale: 0 })
    gsap.to(splash, {
      scale: 1,
      duration: 0.85,
      ease: 'power3.inOut',
      onComplete: () => router.push('/perfil/ajustes'),
    })
  }

  return (
    <div ref={frameRef} className="relative flex min-h-dvh flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="relative z-10 flex shrink-0 items-center border-b border-border px-4 py-4">
        <button
          onClick={handleVoltar}
          aria-label="Voltar"
          className="absolute left-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="mx-auto text-base font-semibold">Alterar senha</h1>
      </div>

      {/* Conteúdo centralizado */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <div className="flex w-full max-w-[320px] flex-col gap-6 px-7">
          <div className="space-y-1.5 text-center">
            <Lock className="mx-auto mb-2 size-9 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-primary">Trocar sua senha</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Informe sua senha atual e defina uma nova.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Senha atual"
                className="h-14 w-full rounded-xl border border-transparent bg-muted/70 pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/30"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Nova senha"
                className="h-14 w-full rounded-xl border border-transparent bg-muted/70 pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/30"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Confirmar nova senha"
                className="h-14 w-full rounded-xl border border-transparent bg-muted/70 pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/30"
              />
            </div>
          </div>

          {/* inputs ainda n tao controlados e o botao n faz nada, só visual por enquanto */}
          <SplashButton className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px">
            Salvar nova senha
          </SplashButton>

          <p className="text-center text-sm">
            <Link
              href="/recuperar-senha"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Esqueci minha senha atual
            </Link>
          </p>
        </div>
      </div>

      {/* Splash de transição ao voltar */}
      <div
        ref={splashRef}
        className="pointer-events-none fixed z-20 rounded-full bg-primary"
        style={{ transform: 'scale(0)' }}
      />
    </div>
  )
}
