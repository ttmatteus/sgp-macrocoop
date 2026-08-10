'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { SplashButton } from '@/components/ui/splash-button'
import { registrarPonto, resetDev } from '@/app/(app)/ponto/actions'
import type { ContratoDisponivel, ErroRegistro, TurnoAberto } from '@/app/(app)/ponto/tipos'
import { usarGeolocalizacao } from './usar-geolocalizacao'
import { enfileirar, lerFila, remover } from './fila-offline'
import { distanciaMetros } from './distancia'

// maplibre toca em window/document no import, entao nao pode entrar no SSR
const MapaPonto = dynamic(() => import('./mapa-ponto').then((m) => m.MapaPonto), {
  ssr: false,
  loading: () => <div className="h-48 w-full animate-pulse border-b border-border bg-muted" />,
})

const MENSAGEM_ERRO: Record<ErroRegistro, string> = {
  'sem-alocacao': 'Você não está alocado nesse contrato.',
  'turno-aberto': 'Você já tem um turno aberto.',
  'sem-turno': 'Não há turno aberto para encerrar.',
  'contrato-errado': 'O turno aberto é de outro contrato.',
  'data-invalida': 'A data do registro não é válida.',
  conexao: 'Não foi possível conectar. A batida ficou salva e será reenviada.',
}

const CHAVE_CONTRATO = 'sgp:ponto:ultimo-contrato'

function ultimoContratoId(): number | null {
  if (typeof window === 'undefined') return null
  const bruto = window.localStorage.getItem(CHAVE_CONTRATO)
  const id = Number(bruto)
  return Number.isFinite(id) && bruto !== null ? id : null
}

const MENSAGEM_GEO = {
  'permissao-negada': 'Permissão negada. Libere a localização no cadeado da barra de endereço.',
  indisponivel: 'Não conseguimos obter sua localização.',
  timeout: 'A localização demorou demais para responder.',
  'sem-suporte': 'Seu navegador não suporta geolocalização.',
  'origem-insegura':
    'O navegador só libera a localização em HTTPS ou localhost. Abrindo por IP da rede, ele bloqueia sem nem perguntar.',
} as const

interface Props {
  contratos: ContratoDisponivel[]
  falhouAoCarregar: boolean
  turnoAberto: TurnoAberto | null
  modoDev: boolean
}

export function PontoScreen({
  contratos,
  falhouAoCarregar,
  turnoAberto: turnoInicial,
  modoDev,
}: Props) {
  const router = useRouter()
  const { posicao, erro: erroGeo, carregando: carregandoGeo, permissao, capturar } = usarGeolocalizacao()

  // com turno aberto o contrato e o dele: a API recusa fechar por outro.
  // sem turno, resgata o ultimo contrato usado (localStorage) pra nao o
  // cooperado com varios contratos ter que procurar toda vez.
  const [contratoId, setContratoId] = useState<number | null>(
    turnoInicial?.contratoId ?? ultimoContratoId() ?? contratos[0]?.id ?? null,
  )
  const [turnoAberto, setTurnoAberto] = useState(!!turnoInicial)
  const [iniciadoEm, setIniciadoEm] = useState<string | null>(turnoInicial?.iniciadoEm ?? null)
  const [enviando, setEnviando] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [pendentes, setPendentes] = useState(0)
  const [agora, setAgora] = useState<Date | null>(null)
  const [resetando, setResetando] = useState(false)
  // dev preview: simula perto/longe do local sem precisar se mexer de verdade
  const [overrideGeo, setOverrideGeo] = useState<'real' | 'perto' | 'longe'>('real')

  // relogio so no cliente: renderizar hora no servidor causaria hydration mismatch
  useEffect(() => {
    setAgora(new Date())
    const id = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setPendentes(lerFila().length)
  }, [])

  const contrato = useMemo(
    () => contratos.find((c) => c.id === contratoId) ?? null,
    [contratos, contratoId],
  )
  const local = contrato?.locais[0] ?? null

  // salva o contrato escolhido pra preencher na proxima visita.
  // so sem turno aberto: durante o turno o contrato e travado e nao deve mudar
  useEffect(() => {
    if (turnoAberto || contratoId === null) return
    window.localStorage.setItem(CHAVE_CONTRATO, String(contratoId))
  }, [contratoId, turnoAberto])

  const geofence = useMemo(() => {
    if (!local) return null
    return {
      latitude: Number(local.latitude),
      longitude: Number(local.longitude),
      raioM: local.raioM,
    }
  }, [local])

  // dev preview: "perto" usa a coordenada exata do local (garante dentro do
  // raio), "longe" desloca ~5,5km (garante fora, nao importa o raio configurado)
  const posicaoEfetiva = useMemo(() => {
    if (modoDev && overrideGeo !== 'real' && geofence) {
      return {
        latitude: geofence.latitude + (overrideGeo === 'longe' ? 0.05 : 0),
        longitude: geofence.longitude,
        precisaoM: 15,
      }
    }
    return posicao
  }, [modoDev, overrideGeo, geofence, posicao])

  const distancia = useMemo(() => {
    if (!posicaoEfetiva || !geofence) return null
    return distanciaMetros(posicaoEfetiva.latitude, posicaoEfetiva.longitude, geofence.latitude, geofence.longitude)
  }, [posicaoEfetiva, geofence])

  const dentroDoRaio = distancia !== null && geofence !== null && distancia <= geofence.raioM

  const reenviarFila = useCallback(async () => {
    const fila = lerFila()
    if (fila.length === 0) return

    for (const item of fila) {
      const r = await registrarPonto(item)
      // so tira da fila se a API confirmou. erro de conexao mantem pra proxima
      if (r.ok || (r.erro && r.erro !== 'conexao')) {
        remover(item.idCliente)
      }
    }
    setPendentes(lerFila().length)
  }, [])

  useEffect(() => {
    void reenviarFila()
    const aoVoltarOnline = () => void reenviarFila()
    window.addEventListener('online', aoVoltarOnline)
    return () => window.removeEventListener('online', aoVoltarOnline)
  }, [reenviarFila])

  const bater = async () => {
    if (!contratoId) return

    setFeedback(null)
    setEnviando(true)

    // pede a permissao aqui, no clique, e nao ao abrir a tela: assim o popup
    // do navegador aparece com contexto do que o cooperado acabou de pedir.
    // posicaoEfetiva ja cobre o override de dev (perto/longe), sem chamar capturar()
    const atual = posicaoEfetiva ?? (await capturar())
    if (!atual) {
      setEnviando(false)
      return
    }

    const dados = {
      idCliente: crypto.randomUUID(),
      contratoId,
      tipo: turnoAberto ? ('saida' as const) : ('entrada' as const),
      registradoEm: new Date().toISOString(),
      latitude: atual.latitude,
      longitude: atual.longitude,
      precisaoM: atual.precisaoM,
    }

    const resultado = await registrarPonto(dados)
    setEnviando(false)

    if (!resultado.ok) {
      if (resultado.erro === 'conexao') {
        enfileirar(dados)
        setPendentes(lerFila().length)
        // otimista: a batida vai subir depois, entao o turno ja vira o novo estado
        setTurnoAberto((v) => !v)
      }
      setFeedback({ tipo: 'erro', texto: MENSAGEM_ERRO[resultado.erro ?? 'conexao'] })
      return
    }

    const abriu = dados.tipo === 'entrada'
    setTurnoAberto(abriu)
    setIniciadoEm(abriu ? dados.registradoEm : null)
    setFeedback({
      tipo: 'ok',
      texto: abriu ? 'Turno iniciado.' : 'Turno finalizado.',
    })
    // refaz a busca no servidor pra o estado da tela nao depender so do react
    router.refresh()
  }

  const semLocalizacao = !posicaoEfetiva
  // nao exige posicao: ela e capturada no proprio clique
  const podeBater = !!contratoId && !enviando && !carregandoGeo

  const limparParaTeste = async () => {
    if (!confirm('Apagar turno e registros de ponto desse usuário pra testar de novo?')) return
    setResetando(true)
    const ok = await resetDev()
    setResetando(false)
    if (ok) {
      setTurnoAberto(false)
      setIniciadoEm(null)
      setFeedback(null)
      router.refresh()
    } else {
      setFeedback({ tipo: 'erro', texto: 'Não foi possível limpar. Só funciona fora de produção.' })
    }
  }

  return (
    <div className={`flex min-h-dvh flex-col bg-background ${modoDev && geofence ? 'pb-14' : ''}`}>
      <div className="relative flex shrink-0 items-center border-b border-border px-4 py-4">
        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Voltar"
          className="absolute left-4 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="mx-auto text-base font-semibold">Registrar Ponto</h1>
        {modoDev && (
          <button
            onClick={() => void limparParaTeste()}
            disabled={resetando}
            title="Dev: apaga turno e registros desse usuário"
            className="absolute right-4 flex items-center gap-1 rounded-full border border-amber-400 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-60"
          >
            {resetando ? <Loader2 className="size-3 animate-spin" /> : 'Limpar (dev)'}
          </button>
        )}
      </div>

      {falhouAoCarregar || contratos.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-muted">
            <MapPin className="size-7 text-muted-foreground" />
          </span>
          <h2 className="text-lg font-semibold">
            {falhouAoCarregar ? 'Não foi possível carregar' : 'Nenhum contrato disponível'}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {falhouAoCarregar
              ? 'Verifique sua conexão e tente de novo.'
              : 'Você não tem alocação ativa em nenhum contrato hoje. Procure a cooperativa.'}
          </p>
          {falhouAoCarregar && (
            <button
              onClick={() => router.refresh()}
              className="mt-2 flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <RefreshCw className="size-4" />
              Tentar novamente
            </button>
          )}
        </div>
      ) : (
        <>
          {contratos.length > 1 && (
            <div className="border-b border-border px-5 py-3">
              <ContratoPicker
                contratos={contratos}
                contratoId={contratoId}
                onChange={setContratoId}
                disabled={turnoAberto}
              />
              {turnoAberto && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Travado enquanto o turno está aberto: a saída precisa ser no mesmo contrato.
                </p>
              )}
            </div>
          )}

          {permissao === 'pendente' && !posicaoEfetiva ? (
            <div className="border-b border-border px-5 py-6">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/12">
                  <MapPin className="size-6 text-primary" />
                </span>
                <div className="space-y-1">
                  <h2 className="text-base font-semibold">Usar sua localização</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Precisamos da sua localização para comprovar que você está no local de
                    trabalho ao registrar o ponto.
                  </p>
                </div>
                <SplashButton
                  onClick={() => void capturar()}
                  disabled={carregandoGeo}
                  className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-70"
                >
                  {carregandoGeo ? <Loader2 className="size-4 animate-spin" /> : 'Permitir localização'}
                </SplashButton>
              </div>
            </div>
          ) : semLocalizacao ? (
            <div className="flex flex-col items-center gap-3 border-b border-border px-8 py-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-muted">
                {carregandoGeo || permissao === 'verificando' ? (
                  <Loader2 className="size-7 animate-spin text-muted-foreground" />
                ) : erroGeo ? (
                  <WifiOff className="size-7 text-destructive" />
                ) : (
                  <MapPin className="size-7 text-muted-foreground" />
                )}
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {carregandoGeo || permissao === 'verificando'
                  ? 'Obtendo sua localização...'
                  : erroGeo
                    ? MENSAGEM_GEO[erroGeo]
                    : 'Aguardando sua localização.'}
              </p>
              {erroGeo && erroGeo !== 'origem-insegura' && !carregandoGeo && (
                <button
                  onClick={() => void capturar()}
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <RefreshCw className="size-4" />
                  Tentar novamente
                </button>
              )}
            </div>
          ) : (
            <>
              <MapaPonto
                latitude={posicaoEfetiva.latitude}
                longitude={posicaoEfetiva.longitude}
                local={geofence}
                dentroDoRaio={dentroDoRaio}
              />

              <div className="border-b border-border px-5 py-4">
                <div className="flex items-start gap-3">
                  <Compass className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-primary">
                      {local?.nome ?? contrato?.nome}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {distancia === null
                        ? 'Sem local de referência cadastrado'
                        : dentroDoRaio
                          ? `Dentro da área (${Math.round(distancia)} m do ponto)`
                          : `Fora da área (${Math.round(distancia)} m, limite ${geofence?.raioM} m)`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col items-center border-b border-border px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {agora
                ? agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                : ' '}
            </p>
            <p className="mt-2 font-mono text-5xl font-bold tracking-tight">
              {agora ? agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </p>

            <div className="mt-6 w-full">
              <SplashButton
                onClick={bater}
                disabled={!podeBater}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 ${
                  turnoAberto ? 'bg-red-600 hover:bg-red-700' : 'bg-neutral-900 hover:bg-black'
                }`}
              >
                {enviando ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <Clock className="size-5" />
                    {turnoAberto ? 'Finalizar Turno' : 'Iniciar Turno'}
                  </>
                )}
              </SplashButton>
            </div>

            {feedback && (
              <p
                className={`mt-4 flex items-center gap-1.5 text-sm ${
                  feedback.tipo === 'ok' ? 'text-success' : 'text-destructive'
                }`}
              >
                {feedback.tipo === 'ok' ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <AlertTriangle className="size-4" />
                )}
                {feedback.texto}
              </p>
            )}

            {!feedback && (
              <p className="mt-4 text-sm text-muted-foreground">
                {turnoAberto
                  ? iniciadoEm
                    ? `Turno em andamento desde ${new Date(iniciadoEm).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : 'Turno em andamento'
                  : 'Nenhum turno ativo'}
              </p>
            )}

            {pendentes > 0 && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <WifiOff className="size-3.5" />
                {pendentes} {pendentes === 1 ? 'batida pendente' : 'batidas pendentes'} de envio
              </p>
            )}
          </div>
        </>
      )}

      {modoDev && geofence && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-1.5 border-t border-amber-400 bg-amber-50 px-4 py-2.5">
          <span className="text-[11px] font-semibold text-amber-700">Dev · localização:</span>
          {(
            [
              ['real', 'Real'],
              ['perto', 'Perto'],
              ['longe', 'Longe'],
            ] as const
          ).map(([v, texto]) => (
            <button
              key={v}
              onClick={() => setOverrideGeo(v)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                overrideGeo === v
                  ? 'bg-amber-500 text-white'
                  : 'border border-amber-400 bg-white text-amber-700 hover:bg-amber-100'
              }`}
            >
              {texto}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ContratoPicker({
  contratos,
  contratoId,
  onChange,
  disabled,
}: {
  contratos: ContratoDisponivel[]
  contratoId: number | null
  onChange: (id: number) => void
  disabled?: boolean
}) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')

  // fecha ao apertar Escape e quando desabilita (turno aberto)
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  useEffect(() => {
    if (disabled) setAberto(false)
  }, [disabled])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return contratos
    return contratos.filter((c) => c.nome.toLowerCase().includes(termo))
  }, [contratos, busca])

  const selecionado = contratos.find((c) => c.id === contratoId) ?? null

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setAberto(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        aria-label="Selecionar contrato"
        className="relative flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none transition-colors focus:border-ring focus:ring-[3px] focus:ring-ring/30 disabled:opacity-60"
      >
        <span className="min-w-0 truncate">
          {selecionado ? (
            <>
              <span className="text-foreground">{selecionado.nome}</span>
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                {selecionado.codigo}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Selecione o contrato</span>
          )}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            aberto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-6"
          onClick={() => setAberto(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Selecionar contrato"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Selecionar contrato</h2>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {contratos.length > 4 && (
              <div className="flex items-center gap-2 border-b border-border px-4">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  autoFocus
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar contrato..."
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            )}

            <ul role="listbox" className="max-h-72 overflow-y-auto">
              {filtrados.length === 0 ? (
                <li className="px-4 py-3 text-sm text-muted-foreground">Nenhum contrato encontrado.</li>
              ) : (
                filtrados.map((c) => {
                  const ativo = c.id === contratoId
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(c.id)
                          setAberto(false)
                          setBusca('')
                        }}
                        aria-selected={ativo}
                        className={`flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left text-sm transition-colors ${
                          ativo
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="flex min-w-0 items-baseline gap-2">
                          <span className="min-w-0 truncate">{c.nome}</span>
                          <span
                            className={`shrink-0 text-xs ${ativo ? 'text-primary/80' : 'text-muted-foreground'}`}
                          >
                            {c.codigo}
                          </span>
                        </span>
                        {ativo && <Check className="size-4 shrink-0" />}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
