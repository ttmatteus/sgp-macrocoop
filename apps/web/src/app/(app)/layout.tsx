import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { buscarPerfil } from '@/lib/perfil'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getSessionUser()
  if (!usuario) {
    redirect('/login')
  }

  // busca aqui e n dentro do PerfilPanel pq a trilha do AppShell mantem os 3
  // paineis montados ao msm tempo, entao o perfil ja precisa dos dados de cara
  const perfil = await buscarPerfil()

  return (
    <AppShell nome={usuario.nome} nivel={usuario.nivel} perfil={perfil}>
      {children}
    </AppShell>
  )
}
