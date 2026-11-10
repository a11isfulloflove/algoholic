import type { Response } from 'express'
import { SESSION_MAX_AGE_SECONDS } from './tokens'

export const SESSION_COOKIE = 'algoholic_session'

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api',
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
  })
}

export function clearSessionCookie(res: Response): void {
  res.cookie(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api',
    maxAge: 0,
  })
}
