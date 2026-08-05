'use client'

import { useRef } from 'react'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils'

/** Botão com splash/ripple no clique — feedback visual para ações primárias nos mockups. */
export function SplashButton({
  className,
  onClick,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref = useRef<HTMLButtonElement>(null)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = ref.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height) * 2.2
      const splash = document.createElement('span')
      splash.style.position = 'absolute'
      splash.style.left = `${e.clientX - rect.left - size / 2}px`
      splash.style.top = `${e.clientY - rect.top - size / 2}px`
      splash.style.width = `${size}px`
      splash.style.height = `${size}px`
      splash.style.borderRadius = '9999px'
      splash.style.background = 'currentColor'
      splash.style.opacity = '0.3'
      splash.style.pointerEvents = 'none'
      btn.appendChild(splash)

      gsap.fromTo(
        splash,
        { scale: 0, opacity: 0.35 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.65,
          ease: 'power2.out',
          onComplete: () => splash.remove(),
        },
      )
    }
    onClick?.(e)
  }

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={cn('relative isolate overflow-hidden', className)}
      {...props}
    >
      {children}
    </button>
  )
}
