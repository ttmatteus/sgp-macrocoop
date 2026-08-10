import { buscarTurnoAberto, listarContratosDisponiveis } from './actions'
import { PontoScreen } from '@/components/ponto/ponto-screen'
import { buscarPerfil } from '@/lib/perfil'

// sem cache: a tela precisa refletir o turno aberto agora, nao um snapshot
export const dynamic = 'force-dynamic'

export default async function PontoPage() {
  const [contratos, turnoAberto, perfil] = await Promise.all([
    listarContratosDisponiveis(),
    buscarTurnoAberto(),
    buscarPerfil(),
  ])

  return (
    <PontoScreen
      contratos={contratos.contratos ?? []}
      falhouAoCarregar={!contratos.ok}
      turnoAberto={turnoAberto}
      modoDev={perfil?.modoDev ?? false}
    />
  )
}
