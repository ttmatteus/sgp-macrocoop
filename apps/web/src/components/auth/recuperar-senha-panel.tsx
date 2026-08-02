'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { ArrowLeft, IdCard, Lock, MailCheck, CheckCircle2 } from 'lucide-react'
import { Stepper } from '@/components/ui/progress'

const totalEtapas = 3
const nomesEtapas = ['', '', '']

export function RecuperarSenhaPanel() {
  const router = useRouter()
  const [etapa, setEtapa] = useState(1)
  const [codigo, setCodigo] = useState(['', '', '', '', '', ''])
  const [verificando, setVerificando] = useState<number | null>(null)
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

  // mock, sem validação real ainda (n manda email, n confere código nem senha)
  const avancar = () => setEtapa((e) => Math.min(e + 1, 4))
  const voltar = () => setEtapa((e) => Math.max(e - 1, 1))

  const setDigito = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1)
    setCodigo((c) => c.map((d, idx) => (idx === i ? digit : d)))
    if (digit) {
      setVerificando(i)
      setTimeout(() => setVerificando((v) => (v === i ? null : v)), 220)
    }
    if (digit && i < 5) {
      document.getElementById(`codigo-${i + 1}`)?.focus()
    }
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
              aria-label="Voltar"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
          {/* Etapa 1 */}
          <div className="flex h-full w-1/4 shrink-0 flex-col items-center justify-center px-7">
            <div className="flex w-full max-w-[320px] flex-col gap-6">
              <div className="space-y-1.5 text-center">
                <IdCard className="mx-auto mb-2 size-9 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight text-primary">
                  Qual é o seu usuário?
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Vamos enviar um código de verificação para o e-mail cadastrado na sua conta.
                </p>
              </div>

              <div className="relative">
                <IdCard className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Usuário"
                  className="h-14 w-full rounded-xl border border-transparent bg-muted/70 pl-12 pr-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/30"
                />
              </div>

              <button
                onClick={avancar}
                className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px"
              >
                Enviar código
              </button>
            </div>
          </div>

          {/* Etapa 2 */}
          <div className="flex h-full w-1/4 shrink-0 flex-col items-center justify-center px-7">
            <div className="flex w-full max-w-[320px] flex-col gap-6">
              <div className="space-y-1.5 text-center">
                <MailCheck className="mx-auto mb-2 size-9 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight text-primary">
                  Verifique seu e-mail
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Enviamos um código de 6 dígitos para{' '}
                  <span className="font-semibold text-foreground">ri****@email.com</span>
                </p>
              </div>

              <div className="flex justify-between gap-2">
                {codigo.map((d, i) => (
                  <input
                    key={i}
                    id={`codigo-${i}`}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => setDigito(i, e.target.value)}
                    className={`h-14 w-full rounded-xl border text-center text-xl font-bold outline-none transition-all duration-200 ease-out focus:ring-[3px] focus:ring-ring/30 ${
                      verificando === i
                        ? 'scale-110 border-success bg-success/10 text-success'
                        : 'scale-100 border-transparent bg-muted/70 text-foreground focus:border-ring focus:bg-card'
                    }`}
                  />
                ))}
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Não recebeu?{' '}
                <a href="#" className="font-semibold text-primary underline-offset-4 hover:underline">
                  Reenviar código
                </a>
              </p>

              <button
                onClick={avancar}
                className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px"
              >
                Verificar
              </button>
            </div>
          </div>

          {/* Etapa 3 */}
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

              <button
                onClick={avancar}
                className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:translate-y-px"
              >
                Salvar nova senha
              </button>
            </div>
          </div>

          {/* Etapa 4 */}
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
