import { Router } from 'express'
import type { DailyProblemResponse } from '@algoholic/shared'
import { prisma } from '../db'

export const dailyRouter = Router()

function utcDayOfYear(date: Date): number {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0)
  return Math.floor((date.getTime() - startOfYear) / 86400000)
}

dailyRouter.get('/', async (_req, res) => {
  const count = await prisma.problem.count({ where: { isPublished: true } })
  if (count === 0) {
    return res.status(404).json({ error: 'no problems available yet' })
  }

  const now = new Date()
  const offset = utcDayOfYear(now) % count

  const pick = await prisma.problem.findMany({
    where: { isPublished: true },
    orderBy: { id: 'asc' },
    skip: offset,
    take: 1,
    select: { slug: true },
  })

  const body: DailyProblemResponse = {
    slug: pick[0].slug,
    date: now.toISOString().slice(0, 10),
  }
  res.json(body)
})
