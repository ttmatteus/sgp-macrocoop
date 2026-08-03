'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { SplashButton } from '@/components/ui/splash-button'
import {
  Bell,
  Mail,
  AlarmClock,
  Moon,
  Lock,
  Smartphone,
  FileText,
  ShieldCheck,
  Info,
  LogOut,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'

export function AjustesPanel({
  onAlterarSenha,
}: {
  onAlterarSenha?: (e: React.MouseEvent) => void
}) {
  const router = useRouter()

  const [pushAtivo, setPushAtivo] = useState(true)
  const [emailAtivo, setEmailAtivo] = useState(false)
  const [lembreteAtivo, setLembreteAtivo] = useState(true)
  const [temaEscuro, setTemaEscuro] = useState(false)

  const toggleTema = (checked: boolean) => {
    setTemaEscuro(checked)
    document.documentElement.classList.toggle('dark', checked)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      {/* Header */}
      <div className="relative flex shrink-0 items-center border-b border-border px-4 py-4">
        <button
          onClick={() => router.push('/perfil')}
          aria-label="Voltar"
          className="absolute left-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="mx-auto text-base font-semibold">Ajustes</h1>
      </div>

      {/* Conteúdo */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 pb-24">
        {/* Notificações */}
        <section>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Notificações
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AjusteRow
              icon={Bell}
              label="Notificações push"
              action={<Switch checked={pushAtivo} onCheckedChange={setPushAtivo} aria-label="Notificações push" />}
            />
            <AjusteRow
              icon={Mail}
              label="Notificações por e-mail"
              action={<Switch checked={emailAtivo} onCheckedChange={setEmailAtivo} aria-label="Notificações por e-mail" />}
            />
            <AjusteRow
              icon={AlarmClock}
              label="Lembrete de bater ponto"
              action={<Switch checked={lembreteAtivo} onCheckedChange={setLembreteAtivo} aria-label="Lembrete de bater ponto" />}
              last
            />
          </div>
        </section>

        {/* Aparência */}
        <section>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Aparência
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AjusteRow
              icon={Moon}
              label="Tema escuro"
              action={<Switch checked={temaEscuro} onCheckedChange={toggleTema} aria-label="Tema escuro" />}
              last
            />
          </div>
        </section>

        {/* Segurança */}
        <section>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Segurança
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AjusteRow icon={Lock} label="Alterar senha" onClick={onAlterarSenha} />
            <AjusteRow icon={Smartphone} label="Sessões ativas" last />
          </div>
        </section>

        {/* Sobre */}
        <section>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sobre
          </p>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AjusteRow icon={FileText} label="Termos de uso" />
            <AjusteRow icon={ShieldCheck} label="Política de privacidade" />
            <AjusteRow icon={Info} label="Versão do app" value="1.0.0" last />
          </div>
        </section>

        {/* Sair */}
        <button
          onClick={() => router.push('/login')}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          Sair da conta
        </button>
      </div>
    </div>
  )
}

function AjusteRow({
  icon: Icon,
  label,
  value,
  action,
  onClick,
  last = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value?: string
  action?: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  last?: boolean
}) {
  const conteudo = (
    <>
      <div className="flex items-center gap-3">
        <Icon className="size-4.5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      {action ? action : value ? (
        <span className="text-sm text-muted-foreground">{value}</span>
      ) : onClick ? (
        <ChevronRight className="size-4 text-border" />
      ) : null}
    </>
  )

  if (onClick) {
    return (
      <SplashButton
        onClick={onClick}
        className={`flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted ${
          !last ? 'border-b border-border' : ''
        }`}
      >
        {conteudo}
      </SplashButton>
    )
  }

  return (
    <div
      className={`flex w-full items-center justify-between p-3.5 text-left ${!last ? 'border-b border-border' : ''}`}
    >
      {conteudo}
    </div>
  )
}
