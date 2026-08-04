'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'
import { SplashButton } from '@/components/ui/splash-button'

// mock local por enquanto, o back de alterar-senha ainda n existe (esqueleto vazio)
const SENHA_ATUAL_MOCK = 'Teste@123'

export default function AlterarSenhaPage() {
  const router = useRouter()
  const frameRef = useRef<HTMLDivElement>(null)
  const splashRef = useRef<HTMLDivElement>(null)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState<'senha_atual' | 'confirmacao' | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  // nova senha e confirmar compartilham um olhinho só, são um par (ver um sem o outro n ajuda muito)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)

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

  const handleSalvar = () => {
    if (senhaAtual !== SENHA_ATUAL_MOCK) {
      setErro('senha_atual')
      return
    }
    if (!novaSenha || novaSenha !== confirmarSenha) {
      setErro('confirmacao')
      return
    }

    setErro(null)
    setSalvando(true)
    // mock: simula a chamada até o back de vdd existir
    setTimeout(() => {
      setSalvando(false)
      setSucesso(true)
      setTimeout(() => router.push('/perfil/ajustes'), 1800)
    }, 900)
  }

  if (sucesso) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-7 text-center">
        <CheckCircle2 className="size-14 text-success" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Senha alterada!</h2>
          <p className="text-sm text-muted-foreground">Sua senha foi trocada com sucesso.</p>
        </div>
      </div>
    )
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
                type={mostrarSenhaAtual ? 'text' : 'password'}
                placeholder="Senha atual"
                value={senhaAtual}
                onChange={(e) => {
                  setSenhaAtual(e.target.value)
                  setErro(null)
                }}
                className={`h-14 w-full rounded-xl border bg-muted/70 pl-12 pr-12 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-card focus:ring-[3px] ${
                  erro === 'senha_atual'
                    ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                    : 'border-transparent focus:border-ring focus:ring-ring/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaAtual((v) => !v)}
                aria-label={mostrarSenhaAtual ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {mostrarSenhaAtual ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {erro === 'senha_atual' && (
              <p className="text-sm font-medium text-destructive">Senha atual incorreta. Tente novamente.</p>
            )}

            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type={mostrarNovaSenha ? 'text' : 'password'}
                placeholder="Nova senha"
                value={novaSenha}
                onChange={(e) => {
                  setNovaSenha(e.target.value)
                  setErro(null)
                }}
                className={`h-14 w-full rounded-xl border bg-muted/70 pl-12 pr-12 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-card focus:ring-[3px] ${
                  erro === 'confirmacao'
                    ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                    : 'border-transparent focus:border-ring focus:ring-ring/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setMostrarNovaSenha((v) => !v)}
                aria-label={mostrarNovaSenha ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {mostrarNovaSenha ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type={mostrarNovaSenha ? 'text' : 'password'}
                placeholder="Confirmar nova senha"
                value={confirmarSenha}
                onChange={(e) => {
                  setConfirmarSenha(e.target.value)
                  setErro(null)
                }}
                className={`h-14 w-full rounded-xl border bg-muted/70 pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-card focus:ring-[3px] ${
                  erro === 'confirmacao'
                    ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                    : 'border-transparent focus:border-ring focus:ring-ring/30'
                }`}
              />
            </div>
            {erro === 'confirmacao' && (
              <p className="text-sm font-medium text-destructive">As senhas não coincidem.</p>
            )}
          </div>

          <SplashButton
            onClick={handleSalvar}
            disabled={salvando}
            className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px disabled:opacity-70"
          >
            {salvando ? 'Salvando...' : 'Salvar nova senha'}
          </SplashButton>

          <p className="text-center text-sm">
            {/* aponta pro fluxo de recuperar-senha, que ainda vai ser portado numa proxima branch */}
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
