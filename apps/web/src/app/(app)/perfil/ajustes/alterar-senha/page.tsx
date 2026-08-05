'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react'
import { SplashButton } from '@/components/ui/splash-button'
import { alterarSenha } from './actions'

// mesma regra do AlterarSenhaDto no back
const MIN_SENHA = 8
const MAX_SENHA = 72

export default function AlterarSenhaPage() {
  const router = useRouter()
  const frameRef = useRef<HTMLDivElement>(null)
  const splashRef = useRef<HTMLDivElement>(null)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const handleSalvar = async () => {
    if (!senhaAtual || !senhaNova) {
      setErro('Preencha todos os campos.')
      return
    }

    if (senhaNova.length < MIN_SENHA || senhaNova.length > MAX_SENHA) {
      setErro(`A nova senha deve ter entre ${MIN_SENHA} e ${MAX_SENHA} caracteres.`)
      return
    }

    if (senhaNova !== confirmacao) {
      setErro('As senhas não conferem.')
      return
    }

    if (senhaNova === senhaAtual) {
      setErro('A nova senha precisa ser diferente da atual.')
      return
    }

    setErro('')
    setCarregando(true)
    const resultado = await alterarSenha(senhaAtual, senhaNova)
    setCarregando(false)

    if (!resultado.ok) {
      setErro(
        resultado.erro === 'senha_incorreta'
          ? 'A senha atual está incorreta.'
          : resultado.erro === 'inativo'
            ? 'Seu vínculo está inativo. Procure a cooperativa.'
            : resultado.erro === 'nao_encontrado'
              ? 'Vínculo não encontrado.'
              : resultado.erro === 'senha'
                ? 'A nova senha não atende aos requisitos.'
                : 'Não foi possível conectar ao servidor. Tente novamente.',
      )
      return
    }

    setSucesso(true)
  }

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

  // trocar a senha revoga o token atual no back, entao n da pra continuar
  // navegando: tem que logar de novo com a senha nova
  if (sucesso) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-7">
        <div className="flex w-full max-w-[320px] flex-col items-center gap-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="size-9 text-success" />
          </span>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-primary">Senha alterada!</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Por segurança sua sessão foi encerrada. Entre de novo com a senha nova.
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="mt-2 h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px"
          >
            Ir para o login
          </button>
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
                type="password"
                placeholder="Senha atual"
                value={senhaAtual}
                onChange={(e) => {
                  setSenhaAtual(e.target.value)
                  setErro('')
                }}
                className="h-14 w-full rounded-xl border border-transparent bg-muted/70 pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/30"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Nova senha"
                value={senhaNova}
                onChange={(e) => {
                  setSenhaNova(e.target.value)
                  setErro('')
                }}
                className="h-14 w-full rounded-xl border border-transparent bg-muted/70 pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/30"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="Confirmar nova senha"
                value={confirmacao}
                onChange={(e) => {
                  setConfirmacao(e.target.value)
                  setErro('')
                }}
                className="h-14 w-full rounded-xl border border-transparent bg-muted/70 pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/30"
              />
            </div>
            {erro && <p className="text-sm font-medium text-destructive">{erro}</p>}
          </div>

          <SplashButton
            onClick={handleSalvar}
            disabled={carregando}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px disabled:opacity-70"
          >
            {carregando ? <Loader2 className="size-5 animate-spin" /> : 'Salvar nova senha'}
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
