import { buscarTurnoAberto, listarContratosDisponiveis } from './actions'
import { PontoScreen } from '@/components/ponto/ponto-screen'
import { getSessionUser } from '@/lib/session'
import { ehUsuarioDevPreview } from '@/lib/dev-preview'

// sem cache: a tela precisa refletir o turno aberto agora, nao um snapshot
export const dynamic = 'force-dynamic'

export default async function PontoPage() {
  const [contratos, turnoAberto, usuario] = await Promise.all([
    listarContratosDisponiveis(),
    buscarTurnoAberto(),
    getSessionUser(),
  ])

  return (
    <PontoScreen
      contratos={contratos.contratos ?? []}
      falhouAoCarregar={!contratos.ok}
      turnoAberto={turnoAberto}
      modoDev={ehUsuarioDevPreview(usuario?.login)}
    />
  )
}
