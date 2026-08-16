import { listarSessoes } from './actions'
import { SessoesAtivasScreen } from '@/components/perfil/sessoes-ativas-screen'

// sessao pode ser revogada de outro dispositivo a qualquer momento, entao
// nao da pra cachear - sempre busca o estado atual
export const dynamic = 'force-dynamic'

export default async function SessoesAtivasPage() {
  const resultado = await listarSessoes()

  return (
    <SessoesAtivasScreen sessoesIniciais={resultado.itens} falhouAoCarregar={!resultado.ok} />
  )
}
