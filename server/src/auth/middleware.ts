import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../db'
import { SESSION_COOKIE } from './cookies'
import { verifySession } from './tokens'

export interface AuthUser {
  id: number
  email: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE]
    if (typeof token !== 'string') {
      res.status(401).json({ error: 'authentication required' })
      return
    }

    const session = await verifySession(token)
    if (!session) {
      res.status(401).json({ error: 'authentication required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true },
    })
    if (!user) {
      res.status(401).json({ error: 'authentication required' })
      return
    }

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}
