import { Navigate } from 'react-router'
import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../use-auth'

export function RegisterPage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/problems" replace />
  }

  return <AuthForm mode="register" />
}
