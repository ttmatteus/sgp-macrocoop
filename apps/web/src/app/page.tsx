'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { HelpCircle } from 'lucide-react'

const onboardingSlides = [
  {
    src: '/telas/onboarding-1.png',
    titulo: (
      <>
        Ponto certo,
        <br />
        equipe unida.
      </>
    ),
    descricao:
      'Com o GDC, o registro de ponto fica simples, seguro e eficiente para toda a empresa.',
  },
  {
    src: '/telas/onboarding-2.png',
    titulo: (
      <>
        Mais controle,
        <br />
        mais confiança.
      </>
    ),
    descricao:
      'Registre, acompanhe e gerencie os horários da sua equipe em tempo real.',
  },
  {
    src: '/telas/onboarding-3.png',
    titulo: (
      <>
        Sua gestão,
        <br />
        na palma da mão.
      </>
    ),
    descricao:
      'Acompanhe indicadores, escalas e histórico direto do seu computador ou celular.',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [slide, setSlide] = useState(0)
  const slideAtual = onboardingSlides[slide]
  const frameRef = useRef<HTMLDivElement>(null)
  const splashRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % onboardingSlides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [slide])

  const handleEntrarClick = (e: React.MouseEvent) => {
    const frame = frameRef.current
    const splash = splashRef.current
    if (!frame || !splash) {
      router.push('/login')
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
      onComplete: () => router.push('/login'),
    })
  }

  return (
    <div ref={frameRef} className="relative flex min-h-[var(--app-height)] flex-col overflow-hidden bg-[#fdf2ea]">
      {/* Header: marca + ajuda */}
      <div className="relative z-20 flex items-start justify-between px-7 pt-6">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-extrabold leading-none tracking-tight text-primary">GDC</span>
          <span className="text-[11px] leading-tight text-muted-foreground">
            Sistema de
            <br />
            Gestão de Cooperativas
          </span>
        </div>
        <a
          href="#"
          aria-label="Precisa de ajuda?"
          className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <HelpCircle className="size-4" />
        </a>
      </div>

      {/* Carrossel de imagens */}
      <div className="relative z-0 mt-3 h-[300px] shrink-0 overflow-hidden bg-[#fdf2ea]">
        {onboardingSlides.map((s, i) => (
          <Image
            key={s.src}
            src={s.src}
            alt=""
            fill
            sizes="100vw"
            priority={i === slide}
            className={`object-cover transition-opacity duration-300 ${
              i === slide ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {/* Wave orgânica + área verde */}
      <div className="relative -mt-1 flex flex-1 flex-col bg-primary text-primary-foreground">
        <svg
          aria-hidden
          viewBox="0 0 380 80"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -top-[79px] left-0 h-20 w-full text-primary"
          fill="currentColor"
        >
          <path d="M0,80 L0,50 C40,50 70,10 130,10 C180,10 200,45 250,45 C300,45 330,15 380,15 L380,80 Z" />
        </svg>

        <div className="flex flex-1 flex-col justify-between gap-8 px-8 pb-8 pt-4">
          <div className="space-y-4 text-center">
            <h2 className="text-[26px] font-bold leading-tight">{slideAtual.titulo}</h2>
            <p className="mx-auto min-h-[68px] max-w-[280px] text-sm leading-relaxed text-primary-foreground/85">
              {slideAtual.descricao}
            </p>
            <div
              role="tablist"
              aria-label="Slides de boas-vindas"
              className="flex items-center justify-center gap-2 pt-1"
            >
              {onboardingSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === slide}
                  aria-label={`Ir para slide ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className={`h-1 shrink-0 rounded-full border-0 p-0 transition-all ${
                    i === slide
                      ? 'w-8 bg-primary-foreground'
                      : 'w-4 bg-primary-foreground/40 hover:bg-primary-foreground/60'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <button
              onClick={handleEntrarClick}
              className="h-13 w-full rounded-xl bg-card py-3.5 text-base font-semibold text-primary shadow-sm transition-colors hover:bg-card/90 active:translate-y-px"
            >
              Entrar
            </button>
            <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-sm text-primary-foreground/80">
              <HelpCircle className="size-4" />
              Precisa de ajuda?
            </p>
          </div>
        </div>
      </div>

      {/* Splash de transição expande a partir do clique em "Entrar" */}
      <div
        ref={splashRef}
        className="pointer-events-none fixed z-30 rounded-full bg-primary"
        style={{ transform: 'scale(0)' }}
      />
    </div>
  )
}
