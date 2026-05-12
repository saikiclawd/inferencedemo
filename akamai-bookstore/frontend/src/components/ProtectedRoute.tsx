import { useAuthStore } from '../store/auth.store.ts'
import keycloak from '../keycloak.ts'
import { useEffect } from 'react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) keycloak.login()
  }, [isAuthenticated])

  if (!isAuthenticated) return null
  return <>{children}</>
}
