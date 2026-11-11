import type { NextFunction, Request, Response } from 'express'
import type { UserPublic } from '@algoholic/shared'
import { prisma } from '../db'
import { SESSION_COOKIE } from './cookies'
import { verifySession } from './tokens'

declare global {
  namespace Express {
    interface Request {
      user?: UserPublic
    }
  }
}

const USER_SELECT = {
  id: true,
  username: true,
  name: true,
  avatar: true,
  createdAt: true,
} as const

export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE]
    if (typeof token !== 'string') {
      next()
      return
    }

    const session = await verifySession(token)
    if (!session) {
      next()
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: USER_SELECT,
    })
    if (user) {
      req.user = { ...user, createdAt: user.createdAt.toISOString() }
    }
    next()
  } catch (err) {
    next(err)
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
      select: USER_SELECT,
    })
    if (!user) {
      res.status(401).json({ error: 'authentication required' })
      return
    }

    req.user = { ...user, createdAt: user.createdAt.toISOString() }
    next()
  } catch (err) {
    next(err)
  }
}
