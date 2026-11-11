import { createContext } from 'react'
import type { AuthUser } from './api'

export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (
    username: string,
    password: string,
    name?: string,
    avatar?: string,
  ) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: AuthUser) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
