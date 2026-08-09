import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { buscarPerfil } from '@/lib/perfil'
import { buscarTurnoAberto } from '@/app/(app)/ponto/actions'
import { ehUsuarioDevPreview } from '@/lib/dev-preview'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getSessionUser()
  if (!usuario) {
    redirect('/login')
  }

  // busca aqui e n dentro do PerfilPanel pq a trilha do AppShell mantem os 3
  // paineis montados ao msm tempo, entao o perfil ja precisa dos dados de cara.
  // o turno aberto entra junto pq o dashboard mostra o estado atual do ponto
  const [perfil, turnoAberto] = await Promise.all([buscarPerfil(), buscarTurnoAberto()])

  return (
    <AppShell
      nome={usuario.nome}
      nivel={usuario.nivel}
      perfil={perfil}
      turnoAberto={turnoAberto}
      modoDev={ehUsuarioDevPreview(usuario.login)}
    >
      {children}
    </AppShell>
  )
}
