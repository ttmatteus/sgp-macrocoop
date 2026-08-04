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

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const trackRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const splashRef = useRef<HTMLDivElement>(null)
  const montouRef = useRef(false)

  // alterar-senha n é aba da trilha, é navegação pra frente, ai n renderiza a
  // trilha aqui pq o router já foi pra outra pagina
  const emAlterarSenha = pathname.startsWith('/perfil/ajustes/alterar-senha')
  const tela: 'perfil' | 'ajustes' = pathname === '/perfil/ajustes' ? 'ajustes' : 'perfil'

  useEffect(() => {
    // enquanto tá no alterar-senha a div da trilha nem existe no dom (ve o
    // return <>{children}</> ali embaixo). qnd volta ela remonta do zero sem
    // transform, entao conta como um "primeiro mount" de novo
    if (emAlterarSenha) {
      montouRef.current = false
      return
    }
    if (!trackRef.current) return
    const xPercent = tela === 'perfil' ? 0 : -50

    // no primeiro mount (reload ou voltando do alterar-senha) a trilha já
    // nasce na aba certa, sem deslizar a partir do perfil
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
  }, [tela, emAlterarSenha])

  // splash verde que expande do clique e revela o alterar-senha por baixo
  // fica aqui no layout (fora da trilha que o gsap transforma) e acima do
  // navbar, senão o transform da trilha prende o splash num stacking context
  // isolado e o navbar (fixed) fica por cima dele mesmo com z-index maior
  const handleAlterarSenha = (e: React.MouseEvent) => {
    const frame = frameRef.current
    const splash = splashRef.current
    if (!frame || !splash) {
      router.push('/perfil/ajustes/alterar-senha')
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
      onComplete: () => router.push('/perfil/ajustes/alterar-senha'),
    })
  }

  // alterar-senha empilha (navegação pra frente), n é aba da trilha, só
  // renderiza o conteúdo real da rota aqui
  if (emAlterarSenha) return <>{children}</>;

  return (
    <div ref={frameRef} className="relative h-dvh overflow-hidden bg-background">
      <div ref={trackRef} className="flex h-full w-[200%]">
        <div className="h-full w-1/2 shrink-0">
          <PerfilPanel />
        </div>
        <div className="h-full w-1/2 shrink-0">
          <AjustesPanel onAlterarSenha={handleAlterarSenha} />
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

      {/* splash de transição, precisa ficar acima do navbar (z maior que 20) */}
      <div
        ref={splashRef}
        className="pointer-events-none fixed z-30 rounded-full bg-primary"
        style={{ transform: 'scale(0)' }}
      />
    </div>
  )
}
