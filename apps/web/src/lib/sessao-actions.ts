'use server'

import { unstable_rethrow } from 'next/navigation'
import { apiFetchOuRedirecionar } from './backend'

// chamado periodicamente pelo AppShell pra forcar a checagem de sessao
export async function verificarSessaoAtiva(): Promise<void> {
  try {
    await apiFetchOuRedirecionar('/perfil')
  } catch (erro) {
    unstable_rethrow(erro)
  }
}
