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

const USER_SELECT = { id: true, username: true, name: true, avatar: true, createdAt: true } as const

const nameSchema = z.string().trim().min(2).max(30)
const avatarSchema = z.enum(AVATARS)

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(24)
  .regex(/^[a-z0-9_]+$/, 'only lowercase letters, numbers and underscores')

const loginSchema = z.object({
  username: usernameSchema,
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(100),
  newPassword: z.string().min(8).max(100),
})

const changeUsernameSchema = z.object({
  currentPassword: z.string().min(1).max(100),
  newUsername: usernameSchema,
})

const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 5 })
const changePasswordLimiter = createRateLimiter({ windowMs: 60_000, max: 5 })
const changeUsernameLimiter = createRateLimiter({ windowMs: 60_000, max: 5 })

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

  const { username, password, name, avatar } = parsed.data
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return res.status(409).json({ error: 'username already taken' })
  }

  const passwordHash = await hashPassword(password)
  const created = await prisma.user.create({
    data: { username, passwordHash, name, avatar },
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

  const { username, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'invalid username or password' })
  }

  const token = await signSession({ userId: user.id })
  setSessionCookie(res, token)
  res.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  })
})

authRouter.post('/change-password', changePasswordLimiter, requireUser, async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'authentication required' })
  }

  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid input',
      details: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    })
  }

  const { currentPassword, newPassword } = parsed.data
  const row = await prisma.user.findUnique({ where: { id: user.id } })
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    return res.status(400).json({ error: 'current password is incorrect' })
  }

  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

  res.json({ ok: true })
})

authRouter.post('/change-username', changeUsernameLimiter, requireUser, async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'authentication required' })
  }

  const parsed = changeUsernameSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid input',
      details: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    })
  }

  const { currentPassword, newUsername } = parsed.data
  if (newUsername === user.username) {
    return res.status(400).json({ error: 'that is already your username' })
  }

  const row = await prisma.user.findUnique({ where: { id: user.id } })
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    return res.status(400).json({ error: 'current password is incorrect' })
  }

  const taken = await prisma.user.findUnique({ where: { username: newUsername } })
  if (taken) {
    return res.status(409).json({ error: 'username already taken' })
  }

  const updatedRow = await prisma.user.update({
    where: { id: user.id },
    data: { username: newUsername },
    select: USER_SELECT,
  })
  const updated: UserPublic = {
    ...updatedRow,
    createdAt: updatedRow.createdAt.toISOString(),
  }

  res.json({ user: updated })
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
