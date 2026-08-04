import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { AppShell } from '@/components/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getSessionUser()
  if (!usuario) {
    redirect('/login')
  }

  return <AppShell nome={usuario.nome}>{children}</AppShell>
}
