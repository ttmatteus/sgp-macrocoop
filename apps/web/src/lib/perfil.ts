import { apiFetch } from './backend'

export interface Perfil {
  nome: string
  matricula: string
  cpf: string
  cooperativa: string
  dataAdmissao: string | null
  // vem verificado pela api (JwtAuthGuard), nao de decode de jwt sem checar
  // assinatura - por isso os paineis de dev preview usam esse campo, nao a sessao
  modoDev: boolean
}

// chamado do layout (server component), o apiFetch repassa o cookie da sessao.
// devolve null se a api cair pra tela conseguir renderizar mesmo assim
export async function buscarPerfil(): Promise<Perfil | null> {
  try {
    const res = await apiFetch('/perfil')
    if (!res.ok) return null
    return (await res.json()) as Perfil
  } catch {
    return null
  }
}
