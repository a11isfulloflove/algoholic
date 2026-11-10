import { Router } from 'express'
import type { Difficulty, StatsResponse } from '@algoholic/shared'
import { prisma } from '../db'
import { requireUser } from '../auth/middleware'

export const statsRouter = Router()

statsRouter.use(requireUser)

statsRouter.get('/', async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'authentication required' })
  }

  const [problems, solvedRows, submissionCount, acceptedCount] = await Promise.all([
    prisma.problem.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        difficulty: true,
        category: { select: { slug: true, name: true } },
      },
    }),
    prisma.submission.findMany({
      where: { userId: user.id, status: 'ACCEPTED' },
      select: { problemId: true },
      distinct: ['problemId'],
    }),
    prisma.submission.count({ where: { userId: user.id } }),
    prisma.submission.count({ where: { userId: user.id, status: 'ACCEPTED' } }),
  ])

  const solvedIds = new Set(solvedRows.map((r) => r.problemId))

  const byDifficulty: StatsResponse['byDifficulty'] = {
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
  }
  const categoryMap = new Map<string, StatsResponse['byCategory'][number]>()

  for (const p of problems) {
    const difficulty = p.difficulty.toLowerCase() as Difficulty
    byDifficulty[difficulty].total += 1
    if (solvedIds.has(p.id)) {
      byDifficulty[difficulty].solved += 1
    }

    const category =
      categoryMap.get(p.category.slug) ?? { ...p.category, solved: 0, total: 0 }
    category.total += 1
    if (solvedIds.has(p.id)) {
      category.solved += 1
    }
    categoryMap.set(p.category.slug, category)
  }

  const body: StatsResponse = {
    solvedTotal: solvedIds.size,
    problemsTotal: problems.length,
    submissions: submissionCount,
    accepted: acceptedCount,
    byDifficulty,
    byCategory: [...categoryMap.values()].sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name),
    ),
  }
  res.json(body)
})
