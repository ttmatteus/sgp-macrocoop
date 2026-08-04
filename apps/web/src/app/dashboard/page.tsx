import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/session'
import { DashboardPanel } from '@/components/dashboard/dashboard-panel'

export default async function DashboardPage() {
  const usuario = await getSessionUser()
  if (!usuario) {
    redirect('/login')
  }

  return <DashboardPanel nome={usuario.nome} />
}
