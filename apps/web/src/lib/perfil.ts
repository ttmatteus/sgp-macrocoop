import { apiFetch } from './backend'

export interface Perfil {
  nome: string
  matricula: string
  cpf: string
  cooperativa: string
  dataAdmissao: string | null
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
