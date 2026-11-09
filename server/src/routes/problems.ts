import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import type { ProblemListResponse, ProblemDetail } from '@algoholic/shared'

export const problemsRouter = Router()

const listQuerySchema = z.object({
  category: z
    .string()
    .trim()
    .min(1)
    .optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  q: z
    .string()
    .trim()
    .max(100)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

const DIFFICULTY_TO_DB = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' } as const

problemsRouter.get('/', async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({
      error: 'invalid query parameters',
      details: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    })
  }

  const { category, difficulty, q, page, pageSize } = parsed.data
  const where = {
    isPublished: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(difficulty ? { difficulty: DIFFICULTY_TO_DB[difficulty] } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { slug: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [total, items] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      orderBy: [{ difficulty: 'asc' }, { slug: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        slug: true,
        title: true,
        difficulty: true,
        category: { select: { slug: true, name: true } },
      },
    }),
  ])

  const body: ProblemListResponse = {
    items: items.map((p) => ({
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty.toLowerCase() as ProblemListResponse['items'][number]['difficulty'],
      category: p.category,
    })),
    total,
    page,
    pageSize,
  }
  res.json(body)
})

problemsRouter.get('/:slug', async (req, res) => {
  const problem = await prisma.problem.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: { select: { slug: true, name: true } },
      tests: {
        where: { isSample: true },
        orderBy: { orderIndex: 'asc' },
        select: { args: true, expected: true },
      },
    },
  })

  if (!problem || !problem.isPublished) {
    return res.status(404).json({ error: 'problem not found' })
  }

  const testCount = await prisma.testCase.count({ where: { problemId: problem.id } })

  const body: ProblemDetail = {
    slug: problem.slug,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty.toLowerCase() as ProblemDetail['difficulty'],
    category: problem.category,
    functionName: problem.functionName,
    starterCodeJs: problem.starterCodeJs,
    starterCodeTs: problem.starterCodeTs,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    samples: problem.tests.map((t) => ({
      args: t.args as unknown[],
      expected: t.expected,
    })),
    testCount,
  }
  res.json(body)
})
