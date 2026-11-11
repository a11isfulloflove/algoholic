import { Router } from 'express'
import type { Difficulty, FavoriteLanguage, StatsResponse } from '@algoholic/shared'
import { prisma } from '../db'
import { requireUser } from '../auth/middleware'

export const statsRouter = Router()

statsRouter.use(requireUser)

statsRouter.get('/', async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'authentication required' })
  }

  const [problems, solvedRows, submissionCount, acceptedCount, languageCounts] = await Promise.all([
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
    prisma.submission.groupBy({
      by: ['language'],
      where: { userId: user.id },
      _count: { _all: true },
    }),
  ])

  const solvedIds = new Set(solvedRows.map((r) => r.problemId))

  let jsCount = 0
  let tsCount = 0
  for (const row of languageCounts) {
    const count = row._count._all
    if (row.language === 'JAVASCRIPT') {
      jsCount = count
    } else if (row.language === 'TYPESCRIPT') {
      tsCount = count
    }
  }
  const languageTotal = jsCount + tsCount
  let favoriteLanguage: FavoriteLanguage | null = null
  if (languageTotal > 0) {
    const jsShare = Math.round((jsCount / languageTotal) * 100)
    favoriteLanguage =
      jsCount >= tsCount
        ? { language: 'javascript', share: jsShare }
        : { language: 'typescript', share: 100 - jsShare }
  }

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
    favoriteLanguage,
  }
  res.json(body)
})
