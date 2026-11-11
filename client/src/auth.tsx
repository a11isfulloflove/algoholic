import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, type AuthUser } from './api'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const r = await api.login(username, password)
    setUser(r.user)
  }, [])

  const register = useCallback(
    async (username: string, password: string, name?: string, avatar?: string) => {
      const r = await api.register(username, password, name, avatar)
      setUser(r.user)
    },
    [],
  )

  const logout = useCallback(async () => {
    await api.logout()
    setUser(null)
  }, [])

  const updateUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}
