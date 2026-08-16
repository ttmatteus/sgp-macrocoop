'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { ArrowLeft, Laptop, Loader2, Lock, LogOut, MapPin, Monitor, ShieldAlert, Smartphone, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { revogarSessao, revogarTodasSessoes, type Sessao } from '@/app/(app)/perfil/ajustes/sessoes/actions'

// sem lib de user-agent parsing no projeto, regex simples cobre os casos reais
function descreverDispositivo(userAgent: string): { rotulo: string; Icone: typeof Smartphone } {
  if (!userAgent || userAgent === 'desconhecido') {
    return { rotulo: 'Dispositivo desconhecido', Icone: Monitor }
  }

  const movel = /Android|iPhone|iPad|iPod/.test(userAgent)
  const sistema = /Android/.test(userAgent)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(userAgent)
      ? 'iOS'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS/.test(userAgent)
          ? 'Mac'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : null

  const navegador = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : null

  const rotulo = sistema && navegador ? `${navegador} · ${sistema}` : (navegador ?? sistema ?? 'Dispositivo desconhecido')
  return { rotulo, Icone: movel ? Smartphone : Laptop }
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Confirmacao = { tipo: 'uma'; sessao: Sessao } | { tipo: 'todas' } | null

export function SessoesAtivasScreen({
  sessoesIniciais,
  falhouAoCarregar,
}: {
  sessoesIniciais: Sessao[]
  falhouAoCarregar: boolean
}) {
  const router = useRouter()
  const frameRef = useRef<HTMLDivElement>(null)
  const splashRef = useRef<HTMLDivElement>(null)

  const [sessoes, setSessoes] = useState(sessoesIniciais)
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null)
  const [senha, setSenha] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [erroConfirmacao, setErroConfirmacao] = useState('')

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

  const fecharConfirmacao = () => {
    setConfirmacao(null)
    setSenha('')
    setErroConfirmacao('')
  }

  const confirmar = async () => {
    if (!confirmacao || !senha) return
    setConfirmando(true)
    setErroConfirmacao('')

    if (confirmacao.tipo === 'uma') {
      const resultado = await revogarSessao(confirmacao.sessao.jti, senha)
      setConfirmando(false)
      if (!resultado.ok) {
        setErroConfirmacao(
          resultado.erro === 'senha_incorreta' ? 'Senha incorreta.' : 'Não foi possível encerrar essa sessão.',
        )
        return
      }
      setSessoes((atual) => atual.filter((s) => s.jti !== confirmacao.sessao.jti))
      fecharConfirmacao()
      return
    }

    // "todas" derruba a sessao atual junto, entao a resposta certa e sair
    const resultado = await revogarTodasSessoes(senha)
    if (!resultado.ok) {
      setConfirmando(false)
      setErroConfirmacao(resultado.erro === 'senha_incorreta' ? 'Senha incorreta.' : 'Não foi possível encerrar as sessões.')
      return
    }
    router.push('/login')
  }

  return (
    <div ref={frameRef} className="relative flex min-h-[var(--app-height)] flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="relative z-10 flex shrink-0 items-center border-b border-border px-4 py-4">
        <button
          onClick={handleVoltar}
          aria-label="Voltar"
          className="absolute left-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="mx-auto text-base font-semibold">Sessões ativas</h1>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 pb-24">
        {falhouAoCarregar ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Monitor className="size-7 text-muted-foreground" />
            </span>
            <p className="text-sm text-muted-foreground">Não foi possível carregar suas sessões.</p>
            <button
              onClick={() => router.refresh()}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Tentar de novo
            </button>
          </div>
        ) : (
          <>
            <p className="mb-4 px-1 text-sm leading-relaxed text-muted-foreground">
              Dispositivos onde sua conta está conectada agora. Encerre qualquer sessão que você
              não reconheça.
            </p>

            {sessoes.length > 1 && (
              <button
                onClick={() => setConfirmacao({ tipo: 'todas' })}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <ShieldAlert className="size-4" />
                Encerrar todas as sessões
              </button>
            )}

            <div className="space-y-3">
              {sessoes.map((sessao) => {
                const { rotulo, Icone } = descreverDispositivo(sessao.userAgent)
                return (
                  <div
                    key={sessao.jti}
                    className={`relative rounded-2xl border p-4 shadow-sm ${
                      sessao.atual ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                          sessao.atual ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icone className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1 pr-6">
                        <p className="truncate text-sm font-semibold text-foreground">{rotulo}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          {sessao.ip}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          {sessao.atual ? (
                            <Badge variant="success">Sessão atual</Badge>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Conectado em {formatarData(sessao.criadoEm)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {!sessao.atual && (
                      <button
                        onClick={() => setConfirmacao({ tipo: 'uma', sessao })}
                        aria-label="Encerrar essa sessão"
                        title="Encerrar essa sessão"
                        className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <LogOut className="size-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {confirmacao && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 px-6">
          <div className="w-full max-w-xs rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <button
              onClick={fecharConfirmacao}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="size-4" />
            </button>

            <p className="pr-6 text-base font-semibold text-foreground">
              {confirmacao.tipo === 'todas' ? 'Encerrar todas as sessões?' : 'Encerrar essa sessão?'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {confirmacao.tipo === 'todas'
                ? 'Você também vai ser desconectado daqui e vai precisar entrar de novo.'
                : 'Vai ser preciso entrar de novo nesse dispositivo.'}
            </p>

            <div className="relative mt-4">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                autoFocus
                placeholder="Confirme sua senha"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value)
                  setErroConfirmacao('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && void confirmar()}
                className="h-11 w-full rounded-xl border border-transparent bg-muted/70 pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-[3px] focus:ring-ring/30"
              />
            </div>
            {erroConfirmacao && (
              <p className="mt-2 text-sm font-medium text-destructive">{erroConfirmacao}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={fecharConfirmacao}
                disabled={confirmando}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={() => void confirmar()}
                disabled={confirmando || !senha}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive py-2.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-60"
              >
                {confirmando && <Loader2 className="size-4 animate-spin" />}
                Encerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Splash de transição ao voltar */}
      <div
        ref={splashRef}
        className="pointer-events-none fixed z-20 rounded-full bg-primary"
        style={{ transform: 'scale(0)' }}
      />
    </div>
  )
}
