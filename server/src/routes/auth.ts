import { Router } from 'express'
import { z } from 'zod'
import { AVATARS, type UserPublic } from '@algoholic/shared'
import { prisma } from '../db'
import { hashPassword, verifyPassword } from '../auth/password'
import { signSession } from '../auth/tokens'
import { clearSessionCookie, setSessionCookie } from '../auth/cookies'
import { requireUser } from '../auth/middleware'
import { createRateLimiter } from '../rate-limit'

export const authRouter = Router()

const USER_SELECT = { id: true, email: true, name: true, avatar: true, createdAt: true } as const

const nameSchema = z.string().trim().min(2).max(30)
const avatarSchema = z.enum(AVATARS)

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
})

const registerSchema = loginSchema.extend({
  name: nameSchema.optional(),
  avatar: avatarSchema.optional(),
})

const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  avatar: avatarSchema.optional(),
})

const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 5 })

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid input',
      details: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    })
  }

  const { email, password, name, avatar } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'email already registered' })
  }

  const passwordHash = await hashPassword(password)
  const created = await prisma.user.create({
    data: { email, passwordHash, name, avatar },
    select: USER_SELECT,
  })
  const user: UserPublic = { ...created, createdAt: created.createdAt.toISOString() }

  const token = await signSession({ userId: user.id })
  setSessionCookie(res, token)
  res.status(201).json({ user })
})

authRouter.post('/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid input' })
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'invalid email or password' })
  }

  const token = await signSession({ userId: user.id })
  setSessionCookie(res, token)
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  })
})

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

authRouter.get('/me', requireUser, (req, res) => {
  res.json({ user: req.user })
})

authRouter.patch('/me', requireUser, async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'authentication required' })
  }

  const parsed = profileUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid input',
      details: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    })
  }

  const data: { name?: string; avatar?: string } = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.avatar !== undefined) data.avatar = parsed.data.avatar

  const updatedRow = await prisma.user.update({
    where: { id: user.id },
    data,
    select: USER_SELECT,
  })
  const updated: UserPublic = {
    ...updatedRow,
    createdAt: updatedRow.createdAt.toISOString(),
  }

  res.json({ user: updated })
})
