'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { Home, History, User, Settings } from 'lucide-react'
import { logout } from '@/app/(app)/dashboard/actions'
import { DashboardPanel } from '@/components/dashboard/dashboard-panel'
import { LogoutScreen } from '@/components/dashboard/logout-screen'
import { PerfilPanel } from '@/components/perfil/perfil-panel'
import { AjustesPanel } from '@/components/perfil/ajustes-panel'
import type { Perfil } from '@/lib/perfil'
import type { SessionUser } from '@/lib/session'

const bottomNav = [
  { label: 'Início', icon: Home, href: '/dashboard' },
  { label: 'Histórico', icon: History, href: null },
  { label: 'Perfil', icon: User, href: '/perfil' },
  { label: 'Ajustes', icon: Settings, href: '/perfil/ajustes' },
]

type Tela = 'dashboard' | 'perfil' | 'ajustes'

// trilha de 3 paineis (w-[300%], cada um w-1/3 = 100% da tela).
// anima "left" em vez de transform/xPercent de propósito: o DashboardPanel
// usa bastante position:fixed (fab, drawer, modal de sair), e um transform
// no ancestral vira containing block pra esses fixed, prendendo eles dentro
// da trilha em vez da tela inteira. left não tem esse efeito colateral, MAS
// % de "left" é relativo à largura do elemento pai (a tela, 100%), não da
// própria trilha (300%) — por isso aqui é -100%/-200% pra andar um painel
// inteiro por vez, diferente do xPercent (que seria relativo à trilha)
const posicaoPorTela: Record<Tela, string> = {
  dashboard: '0%',
  perfil: '-100%',
  ajustes: '-200%',
}

export function AppShell({
  nome,
  nivel,
  perfil,
  children,
}: {
  nome: string
  nivel: SessionUser['nivel']
  perfil: Perfil | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const trackRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const splashRef = useRef<HTMLDivElement>(null)
  const montouRef = useRef(false)
  const [saindo, setSaindo] = useState(false)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  // centralizado aqui pq dashboard, perfil e ajustes têm botão de sair, cada um
  const pedirConfirmacaoSaida = () => setConfirmandoSaida(true)

  const confirmarSaida = async () => {
    setConfirmandoSaida(false)
    setSaindo(true)
    await logout()
    setTimeout(() => router.push('/login'), 1800)
  }

  // alterar-senha n é aba da trilha, é navegação pra frente, ai n renderiza a
  // trilha aqui pq o router já foi pra outra pagina
  const emAlterarSenha = pathname.startsWith('/perfil/ajustes/alterar-senha')
  const tela: Tela = pathname === '/perfil/ajustes' ? 'ajustes' : pathname === '/perfil' ? 'perfil' : 'dashboard'

  useEffect(() => {
    // enquanto tá no alterar-senha a div da trilha nem existe no dom (ve o
    // return <>{children}</> ali embaixo). qnd volta ela remonta do zero sem
    // transform, entao conta como um "primeiro mount" de novo
    if (emAlterarSenha) {
      montouRef.current = false
      return
    }
    if (!trackRef.current) return
    const left = posicaoPorTela[tela]

    // no primeiro mount (reload ou voltando do alterar-senha) a trilha já
    // nasce na aba certa, sem deslizar a partir do dashboard
    if (!montouRef.current) {
      montouRef.current = true
      gsap.set(trackRef.current, { left })
      return
    }

    gsap.to(trackRef.current, {
      left,
      duration: 0.5,
      ease: 'power2.inOut',
    })
  }, [tela, emAlterarSenha])

  // splash verde que expande do clique e revela o alterar-senha por baixo.
  // fica aqui fora da trilha (que o gsap transforma) e acima do navbar,
  // senão o transform da trilha prende o splash num stacking context isolado
  // e o navbar (fixed) fica por cima dele mesmo com z-index maior
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

  if (saindo) {
    return <LogoutScreen />
  }

  // alterar-senha empilha (navegação pra frente), n é aba da trilha, só
  // renderiza o conteúdo real da rota aqui
  if (emAlterarSenha) return <>{children}</>

  return (
    <div ref={frameRef} className="relative h-dvh overflow-hidden bg-background">
      <div ref={trackRef} className="relative left-0 flex h-full w-[300%]">
        <div className="h-full w-1/3 shrink-0">
          <DashboardPanel nome={nome} onSair={pedirConfirmacaoSaida} />
        </div>
        <div className="h-full w-1/3 shrink-0">
          <PerfilPanel
            nome={nome}
            nivel={nivel}
            perfil={perfil}
            onSair={pedirConfirmacaoSaida}
          />
        </div>
        <div className="h-full w-1/3 shrink-0">
          <AjustesPanel onAlterarSenha={handleAlterarSenha} onSair={pedirConfirmacaoSaida} />
        </div>
      </div>

      {/* bottom nav, fica por cima da trilha sempre visível */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around rounded-t-2xl border-t border-border bg-card px-3 pb-4 pt-2 shadow-lg">
        {bottomNav.map((item) => {
          const ativo =
            (item.label === 'Início' && tela === 'dashboard') ||
            (item.label === 'Perfil' && tela === 'perfil') ||
            (item.label === 'Ajustes' && tela === 'ajustes')
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
            <button key={item.label} className={className} disabled>
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

      {/* Confirmação de saída, compartilhada entre dashboard/perfil/ajustes */}
      {confirmandoSaida && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 px-6">
          <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-5 text-center shadow-2xl">
            <div className="mx-auto flex size-16 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- gif animado, o next/image tira a animação */}
              <img src="/face-triste.gif" alt="" className="size-full object-contain" />
            </div>
            <p className="mt-1 text-base font-semibold text-foreground">Sair da conta?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Você vai precisar entrar de novo pra acessar o SGP.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmandoSaida(false)}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSaida}
                className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
