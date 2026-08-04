import { LoginPanel } from '@/components/auth/login-panel'

// só tem login aqui por enquanto, recuperar senha (com a trilha deslizante
// entre as 2 telas) vem numa proxima branch
export default function AuthLayout() {
  return (
    <div className="relative h-dvh overflow-hidden bg-background">
      <LoginPanel />
    </div>
  )
}
