import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { hashPassword, verifyPassword } from '../auth/password'
import { signSession } from '../auth/tokens'
import { clearSessionCookie, setSessionCookie } from '../auth/cookies'
import { requireUser } from '../auth/middleware'
import { createRateLimiter } from '../rate-limit'

export const authRouter = Router()

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
})

const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 5 })

authRouter.post('/register', async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid input',
      details: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    })
  }

  const { email, password } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'email already registered' })
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true },
  })

  const token = await signSession({ userId: user.id })
  setSessionCookie(res, token)
  res.status(201).json({ user })
})

authRouter.post('/login', loginLimiter, async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body)
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
  res.json({ user: { id: user.id, email: user.email } })
})

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

authRouter.get('/me', requireUser, (req, res) => {
  res.json({ user: req.user })
})
