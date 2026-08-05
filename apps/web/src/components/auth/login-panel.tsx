'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { IdCard, Lock, HelpCircle, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { SplashButton } from '@/components/ui/splash-button'
import { LoginLoadingScreen } from '@/components/auth/login-loading-screen'
import { login } from '@/app/(auth)/login/actions'

const MAX_TENTATIVAS = 3
const BLOQUEIO_SEGUNDOS = 5 * 60

export function LoginPanel() {
  const router = useRouter()
  const frameRef = useRef<HTMLDivElement>(null)
  const splashRef = useRef<HTMLDivElement>(null)
  const [carregando, setCarregando] = useState(false)
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)
  const [erroConexao, setErroConexao] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [tentativas, setTentativas] = useState(0)
  const [bloqueado, setBloqueado] = useState(false)
  const [segundosRestantes, setSegundosRestantes] = useState(0)

  // vai contando de 1 em 1 seg enquanto tiver bloqueado, dps libera sozinho
  useEffect(() => {
    if (!bloqueado) return

    const interval = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s <= 1) {
          clearInterval(interval)
          setBloqueado(false)
          setTentativas(0)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [bloqueado])

  const handleEntrar = async () => {
    if (bloqueado) return

    setErro(false)
    setErroConexao(false)
    setCarregando(true)

    const resultado = await login(usuario, senha)

    if (!resultado.ok) {
      setCarregando(false)

      if (resultado.erro === 'conexao') {
        setErroConexao(true)
        return
      }

      const novasTentativas = tentativas + 1
      setTentativas(novasTentativas)

      if (novasTentativas >= MAX_TENTATIVAS) {
        setSegundosRestantes(BLOQUEIO_SEGUNDOS)
        setBloqueado(true)
        return
      }

      setErro(true)
      return
    }

    router.push('/dashboard')
  }

  const handleVoltar = (e: React.MouseEvent) => {
    const frame = frameRef.current
    const splash = splashRef.current
    if (!frame || !splash) {
      router.push('/')
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
      onComplete: () => router.push('/'),
    })
  }

  if (carregando) {
    return <LoginLoadingScreen />
  }

  const tempoFormatado = `${String(Math.floor(segundosRestantes / 60)).padStart(2, '0')}:${String(
    segundosRestantes % 60,
  ).padStart(2, '0')}`

  return (
    <div ref={frameRef} className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="relative z-10 shrink-0 border-b border-border/30 px-7 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleVoltar}
              aria-label="Voltar para o onboarding"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-extrabold leading-none tracking-tight text-primary">
                SGP
              </span>
              <span className="text-[11px] leading-tight text-muted-foreground">
                Sistema de
                <br />
                Gestão de Cooperados
              </span>
            </div>
          </div>
          <a
            href="#"
            aria-label="Precisa de ajuda?"
            className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HelpCircle className="size-4" />
          </a>
        </div>
      </div>

      {/* Conteúdo centralizado */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <div className="flex w-full max-w-[320px] flex-col gap-6 px-7">
          <div className="space-y-1.5 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary">
              Bem-vindo de volta!
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Preencha os campos abaixo para acessar sua conta no SGP.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <IdCard className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Usuário"
                value={usuario}
                onChange={(e) => {
                  setUsuario(e.target.value)
                  setErro(false)
                  setErroConexao(false)
                }}
                className={`h-14 w-full rounded-xl border bg-muted/70 pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-card focus:ring-[3px] ${
                  erro
                    ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                    : 'border-transparent focus:border-ring focus:ring-ring/30'
                }`}
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Senha"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value)
                  setErro(false)
                  setErroConexao(false)
                }}
                className={`h-14 w-full rounded-xl border bg-muted/70 pl-12 pr-12 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:bg-card focus:ring-[3px] ${
                  erro
                    ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                    : 'border-transparent focus:border-ring focus:ring-ring/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {mostrarSenha ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
            {erro && !bloqueado && (
              <p className="text-sm font-medium text-destructive">
                Usuário ou senha inválidos. Tente novamente.
              </p>
            )}
            {erroConexao && (
              <p className="text-sm font-medium text-destructive">
                Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.
              </p>
            )}
            {bloqueado && (
              <p className="text-sm font-medium text-destructive">
                Muitas tentativas. Aguarde antes de tentar novamente.
              </p>
            )}
          </div>

          <SplashButton
            onClick={handleEntrar}
            disabled={bloqueado}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px disabled:opacity-70"
          >
            {bloqueado ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Aguarde {tempoFormatado}
              </>
            ) : (
              'Entrar'
            )}
          </SplashButton>

          <p className="text-center text-sm">
            <Link
              href="/recuperar-senha"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </p>
        </div>
      </div>

      {/* Splash de transição ao voltar pro onboarding */}
      <div
        ref={splashRef}
        className="pointer-events-none fixed z-20 rounded-full bg-primary"
        style={{ transform: 'scale(0)' }}
      />
    </div>
  )
}
