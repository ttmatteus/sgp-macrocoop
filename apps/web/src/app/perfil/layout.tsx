'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { Home, History, User, Settings } from 'lucide-react'
import { PerfilPanel } from '@/components/perfil/perfil-panel'
import { AjustesPanel } from '@/components/perfil/ajustes-panel'

const bottomNav = [
  { label: 'Início', icon: Home, href: null },
  { label: 'Histórico', icon: History, href: null },
  { label: 'Perfil', icon: User, href: '/perfil' },
  { label: 'Ajustes', icon: Settings, href: '/perfil/ajustes' },
]

export default function PerfilLayout() {
  const pathname = usePathname()
  const router = useRouter()
  const trackRef = useRef<HTMLDivElement>(null)
  const montouRef = useRef(false)

  const tela: 'perfil' | 'ajustes' = pathname === '/perfil/ajustes' ? 'ajustes' : 'perfil'

  // mesma trilha deslizante do login/recuperar-senha, só que entre perfil e ajustes
  useEffect(() => {
    if (!trackRef.current) return
    const xPercent = tela === 'perfil' ? 0 : -50

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
          <PerfilPanel />
        </div>
        <div className="h-full w-1/2 shrink-0">
          <AjustesPanel />
        </div>
      </div>

      {/* bottom nav, fica por cima da trilha sempre visível */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around rounded-t-2xl border-t border-border bg-card px-3 pb-4 pt-2 shadow-lg">
        {bottomNav.map((item) => {
          const ativo = (item.label === 'Perfil' && tela === 'perfil') || (item.label === 'Ajustes' && tela === 'ajustes')
          const conteudo = (
            <>
              <item.icon className="size-5" />
              {item.label}
            </>
          )
          const className = ativo
            ? 'flex flex-col items-center gap-0.5 rounded-xl bg-primary/12 px-4 py-1.5 text-[11px] font-medium text-primary'
            : 'flex flex-col items-center gap-0.5 px-4 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-primary'
          return item.href ? (
            <Link key={item.label} href={item.href} className={className}>
              {conteudo}
            </Link>
          ) : (
            <button key={item.label} className={className} disabled onClick={() => router.push('/perfil')}>
              {conteudo}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
