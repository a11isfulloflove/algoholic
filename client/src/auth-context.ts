import { createContext } from 'react'
import type { AuthUser } from './api'

export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    name?: string,
    avatar?: string,
  ) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: AuthUser) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
