import { Navigate } from 'react-router'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../auth'

export function LoginPage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/problems" replace />
  }

  return <AuthForm mode="login" />
}
