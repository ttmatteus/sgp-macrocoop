'use client'

import Link from 'next/link'
import {
  Building,
  Calendar,
  ChevronRight,
  CircleUser,
  FileText,
  IdCard,
  Landmark,
  Settings,
  User,
  HelpCircle,
} from 'lucide-react'
import type { Perfil } from '@/lib/perfil'
import type { SessionUser } from '@/lib/session'

// a api manda a data como ISO em UTC (ex: 2022-01-10T00:00:00.000Z). sem forcar
// timeZone UTC aqui o fuso do brasil puxava pro dia anterior
const formatarData = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—'

const iniciais = (nome: string) =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

const acoes = [
  { label: 'Dados Pessoais', icon: User, href: null },
  { label: 'Dados Bancários', icon: Landmark, href: null },
  { label: 'Documentos', icon: FileText, href: null },
  { label: 'Configurações', icon: Settings, href: '/perfil/ajustes' },
  { label: 'Ajuda', icon: HelpCircle, href: null },
]

export function PerfilPanel({
  nome,
  nivel,
  perfil,
  onSair,
}: {
  nome: string
  nivel: SessionUser['nivel']
  perfil: Perfil | null
  onSair: () => void
}) {
  // o nome do jwt serve de reserva se a api n responder
  const nomeExibido = perfil?.nome ?? nome

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header com organic wave */}
      <div className="relative h-32 shrink-0 overflow-hidden bg-primary">
        <div className="relative z-10 flex items-center justify-between px-5 py-3 text-primary-foreground">
          <div className="flex items-center gap-2">
            <CircleUser className="size-8" />
            <h1 className="text-lg font-bold">Perfil</h1>
          </div>
          <button onClick={onSair} className="text-xs font-semibold hover:opacity-80">
            Sair
          </button>
        </div>
        <svg
          aria-hidden
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-10 w-full text-background"
          fill="currentColor"
        >
          <path d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,122.7C672,128,768,192,864,213.3C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-24 pt-4">
        {/* Card de usuário */}
        <section className="relative mt-8 flex shrink-0 flex-col items-center rounded-2xl border border-border bg-card p-4 pb-5 shadow-sm">
          <span className="absolute -top-12 flex size-24 items-center justify-center rounded-full border-4 border-card bg-muted text-2xl font-bold text-foreground shadow-sm">
            {iniciais(nomeExibido)}
          </span>
          <div className="mt-12 flex flex-col items-center">
            <h2 className="text-base font-semibold">{nomeExibido}</h2>
            <p className="text-sm text-muted-foreground capitalize">{nivel}</p>
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-secondary px-4 py-1 text-xs font-semibold text-secondary-foreground">
              <span className="size-2 rounded-full bg-primary" />
              Ativo
            </div>
          </div>
        </section>

        {/* Detalhes grid */}
        <section className="grid shrink-0 grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <IdCard className="size-5 text-primary" />
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Matrícula</p>
            <p className="text-sm font-semibold">{perfil?.matricula ?? '—'}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <Building className="size-5 text-primary" />
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cooperativa</p>
            <p className="text-sm font-semibold">{perfil?.cooperativa ?? '—'}</p>
          </div>
          <div className="col-span-2 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Calendar className="size-5 text-primary" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Data de Admissão</p>
                <p className="text-sm font-semibold">
                  {formatarData(perfil?.dataAdmissao ?? null)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Lista de ações */}
        <section className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {acoes.map((acao, i) => {
            const conteudo = (
              <div className={`group flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50 active:bg-muted ${
                i < acoes.length - 1 ? 'border-b border-border' : ''
              }`}>
                <div className="flex items-center gap-3">
                  <acao.icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  <span className="text-sm font-medium">{acao.label}</span>
                </div>
                <ChevronRight className="size-5 text-border" />
              </div>
            )
            return acao.href ? (
              <Link key={acao.label} href={acao.href}>
                {conteudo}
              </Link>
            ) : (
              <div key={acao.label}>{conteudo}</div>
            )
          })}
        </section>
      </div>
    </div>
  )
}
