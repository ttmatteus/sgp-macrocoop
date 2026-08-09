'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { TurnoAberto } from '@/app/(app)/ponto/tipos'
import {
  Archive,
  Bell,
  Calendar,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Clock,
  LogIn,
  Power,
  UtensilsCrossed,
  FileText,
  FolderOpen,
  GraduationCap,
  Headset,
  HelpCircle,
  History,
  Home,
  Landmark,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Plus,
  PartyPopper,
  Settings,
  Sun,
  Moon,
  User,
  Vote,
  X,
} from 'lucide-react'

// href null = ainda nao tem tela (o botao fica desabilitado)
const acoesRapidas = [
  { label: 'Bater Ponto', icon: Clock, href: '/ponto' },
  { label: 'Histórico', icon: History, href: null },
]

const menuLateral = [
  { label: 'Início', icon: Home, href: '/dashboard' },
  { label: 'Notificações', icon: Bell, href: null },
  { label: 'Bater Ponto', icon: Clock, href: '/ponto' },
  { label: 'SRT', icon: ClipboardList, href: null },
  { label: 'Histórico de Ponto', icon: History, href: null },
  { label: 'Minha Escala', icon: CalendarClock, href: null },
  { label: 'Folha de Produção', icon: FileText, href: null },
  { label: 'Meus Documentos', icon: FolderOpen, href: null },
  { label: 'Perfil', icon: User, href: '/perfil' },
  { label: 'Ajustes', icon: Settings, href: '/perfil/ajustes' },
  { label: 'Mensagens', icon: MessageSquare, href: null },
  { label: 'Financeiro (Extrato)', icon: Landmark, href: null },
  { label: 'Currículo', icon: GraduationCap, href: null },
  { label: 'Eventos', icon: PartyPopper, href: null },
  { label: 'Enquetes', icon: Vote, href: null },
  { label: 'Ouvidoria', icon: Headset, href: null },
  { label: 'Arquivo', icon: Archive, href: null },
]

const escala = [
  { label: 'Entrada', valor: '08:00' },
  { label: 'Intervalo', valor: '12:00 - 13:00' },
  { label: 'Saída', valor: '17:30' },
]

const historico: {
  titulo: string
  data: string
  hora: string
  tag: { label: string; variant: BadgeProps['variant'] }
}[] = [
  {
    titulo: 'Entrada · Início da jornada',
    data: 'Hoje',
    hora: '08:15',
    tag: { label: 'No horário', variant: 'success' },
  },
  {
    titulo: 'Saída · Fim de expediente',
    data: 'Ontem',
    hora: '17:35',
    tag: { label: '+5 min extras', variant: 'warning' },
  },
  {
    titulo: 'Retorno · Almoço',
    data: 'Ontem',
    hora: '13:02',
    tag: { label: 'No horário', variant: 'success' },
  },
]

// rotulos, icones, cores e imagens vindos do ds-sgp (telas/dashboard-coo), os 4
// estados originais. so os 2 primeiros vem de dado real hoje: nosso modelo nao
// distingue "em almoço" de "turno aberto" (almoço e fechar um turno e abrir
// outro, nao um estado dentro do turno), e "encerrar expediente" precisaria
// saber o horario previsto (TipoTurno/escala, card de admin de outra sprint).
// os outros 2 ficam so no seletor dev, pra bater visualmente com o DS
const estadosPonto = {
  semTurno: {
    label: 'Registrar entrada',
    hint: 'Jornada não iniciada',
    icon: LogIn,
    cor: 'success' as const,
    heroImagem: '/telas/dia/dashboard-coo-hero-comeco.png',
    heroImagemNoite: '/telas/noite/dashboard-coo-hero-comeco.png',
    heroTempoLabel: 'Aguardando entrada',
    heroTempoValor: '--:--',
  },
  comTurno: {
    label: 'Sair para almoço',
    hint: 'Trabalhando agora',
    icon: LogOut,
    cor: 'warning' as const,
    heroImagem: '/telas/dia/dashboard-coo-hero-work.png',
    heroImagemNoite: '/telas/noite/dashboard-coo-hero-work.png',
    heroTempoLabel: 'Início da jornada',
    // usado so no preview dev: com dado real o valor vem de horaLocal(turnoAberto.iniciadoEm)
    heroTempoValor: '08:15',
  },
  // preview only, nao vem de dado real (ver comentario acima)
  retornoAlmoco: {
    label: 'Retornar do almoço',
    hint: 'Em horário de almoço',
    icon: UtensilsCrossed,
    cor: 'warning' as const,
    heroImagem: '/telas/dia/dashboard-coo-hero-pausa.png',
    heroImagemNoite: '/telas/noite/dashboard-coo-hero-pausa.png',
    heroTempoLabel: 'Início do intervalo',
    heroTempoValor: '12:00',
  },
  fimExpediente: {
    label: 'Encerrar expediente',
    hint: 'Finalizando o expediente',
    icon: Power,
    cor: 'destructive' as const,
    heroImagem: '/telas/dia/dashboard-coo-hero-final.png',
    heroImagemNoite: '/telas/noite/dashboard-coo-hero-final.png',
    heroTempoLabel: 'Previsão de saída',
    heroTempoValor: '17:45',
  },
}

function horaLocal(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const corEstadoClasses = {
  success: { bg: 'bg-success text-success-foreground', dot: 'bg-success' },
  warning: { bg: 'bg-warning text-warning-foreground', dot: 'bg-warning' },
  destructive: { bg: 'bg-destructive text-destructive-foreground', dot: 'bg-destructive' },
}

const notificacoesPreview = [
  {
    id: 1,
    tipo: 'comunicado' as const,
    titulo: 'Nova política de escala de férias',
    data: 'Há 2 horas',
    lida: false,
  },
  {
    id: 2,
    tipo: 'comunicado' as const,
    titulo: 'Feriado emenda: 25/12 e 26/12',
    data: 'Ontem',
    lida: false,
  },
  { id: 3, tipo: 'documento' as const, titulo: 'Novo documento disponível', data: '2 dias atrás', lida: true },
]

const iconePorTipoNotif = { comunicado: Megaphone, evento: Calendar, documento: FileText }
const corPorTipoNotif = {
  comunicado: 'bg-primary/10 text-primary',
  evento: 'bg-info/10 text-info',
  documento: 'bg-warning/10 text-warning',
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function DashboardPanel({
  nome,
  turnoAberto,
  onSair,
  previewDevAtivo,
  modoDev,
}: {
  nome: string
  turnoAberto: TurnoAberto | null
  onSair: () => void
  previewDevAtivo?: boolean
  modoDev: boolean
}) {
  const router = useRouter()

  // DEV PREVIEW: forca o estado do KPI sem precisar bater ponto de verdade.
  // liberado so pro login marcado em DEV_PREVIEW_LOGIN (ver lib/dev-preview),
  // nao por NODE_ENV, pra dar pra mostrar pra alguem de fora sem rodar local.
  // 'real' usa o turno de verdade; os outros 3 sobrescrevem so pra visualizar
  const [previewDev, setPreviewDev] = useState<keyof typeof estadosPonto | 'real'>('real')
  const [turnoPreview, setTurnoPreview] = useState<'dia' | 'noite'>('dia')
  const emDev = modoDev && previewDevAtivo !== false

  const estadoReal = turnoAberto
    ? { ...estadosPonto.comTurno, heroTempoValor: horaLocal(turnoAberto.iniciadoEm) }
    : estadosPonto.semTurno

  const chaveEstado: keyof typeof estadosPonto =
    emDev && previewDev !== 'real' ? previewDev : turnoAberto ? 'comTurno' : 'semTurno'

  const estadoBase = emDev && previewDev !== 'real' ? estadosPonto[previewDev] : estadoReal
  const estadoAtual =
    emDev && turnoPreview === 'noite'
      ? { ...estadoBase, heroImagem: estadosPonto[chaveEstado].heroImagemNoite }
      : estadoBase

  const [fabAberto, setFabAberto] = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)
  const [notifAberto, setNotifAberto] = useState(false)
  const [devAberto, setDevAberto] = useState(false)
  const [saudacao, setSaudacao] = useState<string | null>(null)

  useEffect(() => {
    const atualizar = () => {
      const hora = new Date().getHours()
      if (hora >= 5 && hora < 12) setSaudacao('Bom dia')
      else if (hora >= 12 && hora < 18) setSaudacao('Boa tarde')
      else setSaudacao('Boa noite')
    }
    atualizar()
    const id = setInterval(atualizar, 60_000)
    return () => clearInterval(id)
  }, [])

  const pedirConfirmacaoSaida = () => {
    setMenuAberto(false)
    onSair()
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background">
      {/* TopAppBar */}
      <header className="flex h-14 shrink-0 items-center justify-between bg-background px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            className="flex size-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted active:scale-95"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-lg font-extrabold tracking-tight text-primary">SGP</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => setNotifAberto((v) => !v)}
              aria-label="Notificações"
              aria-expanded={notifAberto}
              className="relative flex size-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted active:scale-95"
            >
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 flex size-2.5 items-center justify-center rounded-full bg-destructive ring-2 ring-background" />
            </button>

            <div
              className={`absolute right-0 top-full z-30 mt-2 w-72 origin-top-right rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl transition-all duration-150 ${
                notifAberto ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
              }`}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">Notificações</p>
                <Badge variant="error" className="text-[10px]">
                  {notificacoesPreview.filter((n) => !n.lida).length} novas
                </Badge>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {notificacoesPreview.map((n) => {
                  const Icone = iconePorTipoNotif[n.tipo]
                  return (
                    <div
                      key={n.id}
                      className={`flex w-full items-start gap-2.5 px-4 py-3 text-left ${!n.lida ? 'bg-primary/5' : ''}`}
                    >
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${corPorTipoNotif[n.tipo]}`}>
                        <Icone className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">{n.titulo}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{n.data}</p>
                      </div>
                      {!n.lida && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <button
            aria-label="Ajuda"
            className="flex size-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
          >
            <HelpCircle className="size-5" />
          </button>
        </div>
      </header>

      {notifAberto && <div onClick={() => setNotifAberto(false)} className="fixed inset-0 z-20" />}

      {emDev && (
        <>
          {/* botão colapsado: pill discreto no msm nível do FAB de ações, no lado oposto */}
          {!devAberto && (
            <button
              onClick={() => setDevAberto(true)}
              aria-label="Abrir seletor de visualização"
              className="fixed bottom-24 left-5 z-30 flex items-center gap-1.5 rounded-full border border-border bg-card/90 py-2 pl-2.5 pr-3 shadow-lg backdrop-blur transition-all hover:scale-105 active:scale-95"
            >
              {turnoPreview === 'noite' ? (
                <Moon className="size-4 text-yellow-400" />
              ) : (
                <Sun className="size-4 text-primary" />
              )}
              <span className="text-xs font-semibold text-foreground">
                {turnoPreview === 'noite' ? 'Noite' : 'Dia'}
              </span>
            </button>
          )}

          {/* painel expandido */}
          {devAberto && (
            <div className="fixed bottom-24 left-5 z-50 flex flex-col gap-1.5">
              <button
                onClick={() => setDevAberto(false)}
                aria-label="Fechar seletor"
                className="self-start rounded-full border border-border bg-card/95 p-2 text-muted-foreground shadow-lg backdrop-blur transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>

              <div className="relative z-50 flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card/95 p-2 text-foreground shadow-2xl backdrop-blur">
                <div className="flex flex-wrap items-center justify-center gap-1">
                  <button
                    onClick={() => setPreviewDev('real')}
                    title="Estado real do turno"
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      previewDev === 'real'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Real
                  </button>
                  {(
                    [
                      ['semTurno', 'Entrada'],
                      ['comTurno', 'Sair almoço'],
                      ['retornoAlmoco', 'Voltar almoço *'],
                      ['fimExpediente', 'Fim expediente *'],
                    ] as const
                  ).map(([v, texto]) => (
                    <button
                      key={v}
                      onClick={() => setPreviewDev(v)}
                      title={texto.includes('*') ? 'preview visual: não vem de dado real ainda' : undefined}
                      className={`pointer-events-auto rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        previewDev === v
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {texto}
                    </button>
                  ))}
                </div>

                <div className="pointer-events-auto flex min-w-0 items-center gap-2.5 rounded-full bg-muted p-1 text-foreground">
                  {(
                    [
                      ['dia', Sun, 'Ver modo dia'],
                      ['noite', Moon, 'Ver turno da noite'],
                    ] as const
                  ).map(([v, Icone, titulo]) => (
                    <button
                      key={v}
                      onClick={() => setTurnoPreview(v)}
                      title={titulo}
                      aria-label={titulo}
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                        turnoPreview === v
                          ? v === 'noite'
                            ? 'bg-slate-900 text-yellow-300 shadow-inner'
                            : 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icone className="size-4" />
                    </button>
                  ))}
                  <span className="pr-2 text-xs font-medium text-muted-foreground">
                    {turnoPreview === 'dia' ? 'Dia' : 'Noite'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Conteúdo */}
      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pt-1 pb-24">
        {/* Hero — boas-vindas + status */}
        <section className="relative flex min-h-[340px] shrink-0 flex-col justify-end overflow-hidden rounded-2xl bg-background p-5 text-white dark:bg-neutral-800">
          <Image
            src={estadoAtual.heroImagem}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover brightness-110"
            priority
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent dark:hidden" />
          <div className="absolute inset-0 hidden bg-gradient-to-t from-black/70 via-black/15 to-transparent dark:block" />
          <div className="relative z-10 flex flex-col gap-5">
            <div className="translate-y-1">
              <h1 className="mb-2 text-2xl font-bold">
                {saudacao ? `${saudacao}, ${nome.split(' ')[0]}!` : `Olá, ${nome.split(' ')[0]}!`}
              </h1>
              <div className="flex w-fit items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur">
                <span className={`size-2.5 animate-pulse rounded-full ${corEstadoClasses[estadoAtual.cor].dot}`} />
                <span className="text-xs font-semibold uppercase tracking-wider">{estadoAtual.hint}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="mb-0.5 text-xs font-semibold">{estadoAtual.heroTempoLabel}</p>
              <p className="font-mono text-4xl font-bold leading-none">{estadoAtual.heroTempoValor}</p>
            </div>
          </div>
        </section>

        {/* Bater ponto */}
        <div className="flex shrink-0 flex-col items-center gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Sua jornada de hoje</h2>
            <p className="text-sm text-muted-foreground">4 horas e 15 minutos registrados</p>
          </div>

          <button
            onClick={() => router.push('/ponto')}
            aria-label="Ir para registrar ponto"
            className={`relative flex size-44 flex-col items-center justify-center gap-2 rounded-full opacity-90 shadow-xl transition-transform active:scale-95 ${corEstadoClasses[estadoAtual.cor].bg}`}
          >
            <estadoAtual.icon className="size-9" />
            <span className="text-base font-semibold">{estadoAtual.label}</span>
          </button>

          <div className="flex w-full items-center justify-around pt-1">
            <div className="text-center">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Saldo do dia
              </p>
              <p className="font-mono text-lg font-bold text-success">+00:15</p>
            </div>
            <span className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Previsão saída
              </p>
              <p className="font-mono text-lg font-bold text-foreground">17:45</p>
            </div>
          </div>
        </div>

        {/* Escala do dia */}
        <div className="relative shrink-0 overflow-hidden rounded-2xl bg-accent p-5 text-accent-foreground">
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <CalendarClock className="size-5" />
                Escala do dia
              </h3>
            </div>
            <ul className="space-y-3">
              {escala.map((e) => (
                <li key={e.label} className="flex items-center justify-between rounded-lg bg-card/70 px-3 py-2.5">
                  <span className="text-sm font-medium">{e.label}</span>
                  <span className="text-sm font-semibold">{e.valor}</span>
                </li>
              ))}
            </ul>
          </div>
          <Clock aria-hidden className="pointer-events-none absolute -bottom-6 -right-6 size-32 opacity-10" />
        </div>

        {/* Folha de Produção */}
        <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Folha de Produção</p>
            <p className="text-xs text-muted-foreground">Julho 2026 · R$ 3.200,00 bruto</p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-border" />
        </div>

        {/* Histórico recente */}
        <div className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="text-base font-semibold text-foreground">Histórico recente</h3>
          </div>
          <div className="divide-y divide-border">
            {historico.map((h) => (
              <div key={h.titulo} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Clock className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{h.titulo}</p>
                    <p className="text-xs text-muted-foreground">{h.data}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="font-mono text-base font-semibold text-foreground">{h.hora}</p>
                  <Badge variant={h.tag.variant} className="text-[10px]">
                    {h.tag.label}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {fabAberto && <div onClick={() => setFabAberto(false)} className="fixed inset-0 z-10 bg-foreground/10" />}

      {/* FAB — menu de ações rápidas */}
      <div className="fixed bottom-24 right-5 z-20 flex flex-col items-end gap-3">
        {acoesRapidas.map((a, i) => (
          <button
            key={a.label}
            disabled={!a.href}
            onClick={() => {
              if (!a.href) return
              setFabAberto(false)
              router.push(a.href)
            }}
            tabIndex={fabAberto ? 0 : -1}
            style={{ transitionDelay: fabAberto ? `${(acoesRapidas.length - 1 - i) * 40}ms` : '0ms' }}
            className={`flex items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pl-4 pr-1.5 text-sm font-medium text-foreground shadow-lg transition-all duration-200 ease-out ${
              fabAberto ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2 scale-90 opacity-0'
            }`}
          >
            {a.label}
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <a.icon className="size-4" />
            </span>
          </button>
        ))}

        <button
          onClick={() => setFabAberto((v) => !v)}
          aria-label={fabAberto ? 'Fechar ações rápidas' : 'Abrir ações rápidas'}
          aria-expanded={fabAberto}
          className={`flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform active:scale-95 ${
            fabAberto ? 'rotate-45' : ''
          }`}
        >
          <Plus className="size-6" />
        </button>
      </div>

      {/* BottomNav agora é compartilhado, vem do AppShell (trilha dashboard/perfil/ajustes) */}

      {menuAberto && <div onClick={() => setMenuAberto(false)} className="fixed inset-0 z-40 bg-foreground/30" />}

      {/* Menu lateral (drawer) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[78%] max-w-[300px] flex-col bg-card shadow-2xl transition-transform duration-300 ease-out ${
          menuAberto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {iniciais(nome)}
            </span>
            <p className="text-sm font-semibold text-foreground">{nome}</p>
          </div>
          <button
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {menuLateral.map((item) => (
            <button
              key={item.label}
              disabled={!item.href}
              onClick={() => {
                setMenuAberto(false)
                if (item.href) router.push(item.href)
              }}
              className={`flex w-full items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                item.href ? 'text-foreground hover:bg-muted' : 'cursor-default text-muted-foreground/50'
              }`}
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {!item.href && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Em breve
                </span>
              )}
            </button>
          ))}
        </nav>

        <button
          onClick={pedirConfirmacaoSaida}
          className="flex items-center gap-3 border-t border-border px-5 py-3.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4.5 shrink-0" />
          Sair
        </button>
      </div>

      {/* Confirmação de saída fica no AppShell agora, é compartilhada com perfil/ajustes */}
    </div>
  )
}
