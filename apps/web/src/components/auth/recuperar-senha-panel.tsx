'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import {
  ArrowLeft,
  IdCard,
  Lock,
  KeyRound,
  CheckCircle2,
  TriangleAlert,
  Loader2,
} from 'lucide-react'
import { Stepper } from '@/components/ui/progress'
import { confirmarNovaSenha, solicitarRecuperacao } from '@/app/(auth)/recuperar-senha/actions'

const totalEtapas = 3
const nomesEtapas = ['', '', '']

// mesma regra do back (RedefinirSenhaDto): 8+ caracteres, com letra e numero
const senhaValida = (senha: string) => senha.length >= 8 && /[A-Za-z]/.test(senha) && /\d/.test(senha)

export function RecuperarSenhaPanel() {
  const router = useRouter()
  const [etapa, setEtapa] = useState(1)
  const [identificador, setIdentificador] = useState('')
  const [token, setToken] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const montouRef = useRef(false)

  // mesma trilha deslizante do perfil/ajustes, só que entre as etapas do fluxo
  useEffect(() => {
    if (!trackRef.current) return
    const xPercent = -(etapa - 1) * 25

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
  }, [etapa])

  const voltar = () => {
    setErro('')
    setEtapa((e) => Math.max(e - 1, 1))
  }

  const handleSolicitar = async () => {
    if (!identificador.trim()) {
      setErro('Informe seu usuário ou e-mail.')
      return
    }

    setErro('')
    setCarregando(true)
    const resultado = await solicitarRecuperacao(identificador)
    setCarregando(false)

    if (!resultado.ok || !resultado.token) {
      setErro(
        resultado.erro === 'limite'
          ? 'Muitas solicitações seguidas. Aguarde alguns minutos e tente de novo.'
          : resultado.erro === 'conexao'
            ? 'Não foi possível conectar ao servidor. Tente novamente.'
            : 'Não foi possível gerar o token. Confira o que você digitou.',
      )
      return
    }

    setToken(resultado.token)
    setEtapa(2)
  }

  const handleConfirmar = async () => {
    if (!senhaValida(senha)) {
      setErro('A senha precisa ter pelo menos 8 caracteres, com letras e números.')
      return
    }

    if (senha !== confirmacao) {
      setErro('As senhas não conferem.')
      return
    }

    setErro('')
    setCarregando(true)
    const resultado = await confirmarNovaSenha(token, senha)
    setCarregando(false)

    if (!resultado.ok) {
      setErro(
        resultado.erro === 'expirado'
          ? 'O token expirou (vale 15 minutos). Comece de novo.'
          : resultado.erro === 'invalido'
            ? 'Token inválido. Confira se o usuário digitado existe e comece de novo.'
            : resultado.erro === 'senha'
              ? 'A senha não atende aos requisitos.'
              : 'Não foi possível conectar ao servidor. Tente novamente.',
      )
      return
    }

    setEtapa(4)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header: voltar + stepper */}
      <div className="shrink-0 px-7 pb-2 pt-9">
        <div className="flex items-center gap-3">
          {etapa === 1 ? (
            <Link
              href="/login"
              aria-label="Voltar para o login"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </Link>
          ) : (
            <button
              onClick={voltar}
              disabled={etapa === 4}
              aria-label="Voltar"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-0"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}

          {etapa <= totalEtapas && <Stepper steps={nomesEtapas} current={etapa - 1} />}

          <div className="size-8 shrink-0" />
        </div>
      </div>

      {/* conteúdo, trilha deslizante entre as etapas (mesma tecnica de perfil/ajustes) */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <div ref={trackRef} className="flex h-full w-[400%]">
          {/* Etapa 1 — quem é você */}
          <div className="flex h-full w-1/4 shrink-0 flex-col items-center justify-center px-7">
            <div className="flex w-full max-w-[320px] flex-col gap-6">
              <div className="space-y-1.5 text-center">
                <IdCard className="mx-auto mb-2 size-9 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight text-primary">
                  Qual é o seu usuário?
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Vamos gerar um token para você criar uma nova senha.
                </p>
              </div>

              <div className="relative">
                <IdCard className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Usuário ou e-mail"
                  value={identificador}
                  onChange={(e) => {
                    setIdentificador(e.target.value)
                    setErro('')
                  }}
                  className="h-14 w-full rounded-xl border border-transparent bg-muted/70 pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/30"
                />
              </div>

              {etapa === 1 && erro && (
                <p className="text-sm font-medium text-destructive">{erro}</p>
              )}

              <button
                onClick={handleSolicitar}
                disabled={carregando}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px disabled:opacity-70"
              >
                {carregando ? <Loader2 className="size-5 animate-spin" /> : 'Gerar token'}
              </button>
            </div>
          </div>

          {/* Etapa 2 — o token (modo dev, aparece na tela) */}
          <div className="flex h-full w-1/4 shrink-0 flex-col items-center justify-center px-7">
            <div className="flex w-full max-w-[320px] flex-col gap-6">
              <div className="space-y-1.5 text-center">
                <KeyRound className="mx-auto mb-2 size-9 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight text-primary">
                  Seu token de acesso
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Ele vale por 15 minutos. É só continuar para criar a nova senha.
                </p>
              </div>

              {/* aviso de modo dev: enquanto n tiver smtp, o token aparece aqui msm */}
              <div className="flex gap-2.5 rounded-xl border border-warning/40 bg-warning/10 p-3">
                <TriangleAlert className="size-4 shrink-0 text-warning-foreground" />
                <p className="text-xs leading-relaxed text-warning-foreground">
                  <span className="font-semibold">Modo de desenvolvimento.</span> Ainda não temos
                  envio de e-mail, então o token aparece direto na tela. Em produção ele será
                  enviado para o e-mail cadastrado.
                </p>
              </div>

              <p className="break-all rounded-xl bg-muted/70 p-3 text-center font-mono text-xs text-foreground">
                {token}
              </p>

              <button
                onClick={() => setEtapa(3)}
                className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px"
              >
                Continuar
              </button>
            </div>
          </div>

          {/* Etapa 3 — nova senha */}
          <div className="flex h-full w-1/4 shrink-0 flex-col items-center justify-center px-7">
            <div className="flex w-full max-w-[320px] flex-col gap-6">
              <div className="space-y-1.5 text-center">
                <Lock className="mx-auto mb-2 size-9 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight text-primary">
                  Crie uma nova senha
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Use pelo menos 8 caracteres, com letras e números.
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Nova senha"
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value)
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
                {etapa === 3 && erro && (
                  <p className="text-sm font-medium text-destructive">{erro}</p>
                )}
              </div>

              <button
                onClick={handleConfirmar}
                disabled={carregando}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px disabled:opacity-70"
              >
                {carregando ? <Loader2 className="size-5 animate-spin" /> : 'Salvar nova senha'}
              </button>
            </div>
          </div>

          {/* Etapa 4 — deu certo */}
          <div className="flex h-full w-1/4 shrink-0 flex-col items-center justify-center px-7">
            <div className="flex w-full max-w-[320px] flex-col items-center gap-4 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="size-9 text-success" />
              </span>
              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight text-primary">
                  Senha redefinida!
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Sua senha foi alterada com sucesso. Você já pode entrar com a nova senha.
                </p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="mt-2 h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px"
              >
                Voltar para o login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
