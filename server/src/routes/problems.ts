import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireUser } from '../auth/middleware'
import { judgeSubmission, type JudgeTest } from '../judge/judge'
import { createRateLimiter } from '../rate-limit'
import type {
  Language,
  ProblemDetail,
  ProblemListResponse,
  RunSamplesResponse,
  SubmitResponse,
} from '@algoholic/shared'

export const problemsRouter = Router()

const submitBodySchema = z.object({
  language: z.enum(['javascript', 'typescript']),
  code: z.string().min(1).max(65536),
})

const LANGUAGE_TO_DB: Record<Language, 'JAVASCRIPT' | 'TYPESCRIPT'> = {
  javascript: 'JAVASCRIPT',
  typescript: 'TYPESCRIPT',
}

const STATUS_TO_DB = {
  accepted: 'ACCEPTED',
  wrong_answer: 'WRONG_ANSWER',
  time_limit: 'TIME_LIMIT',
  runtime_error: 'RUNTIME_ERROR',
  compile_error: 'COMPILE_ERROR',
  internal_error: 'INTERNAL_ERROR',
} as const

const judgeLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 15,
  key: (req) => String(req.user?.id ?? req.ip ?? 'anonymous'),
})

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

problemsRouter.post('/:slug/run', requireUser, judgeLimiter, async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'authentication required' })
  }

  const body = submitBodySchema.safeParse(req.body)
  if (!body.success) {
    return res.status(400).json({ error: 'invalid input' })
  }

  const slug = String(req.params.slug)
  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: {
      tests: { where: { isSample: true }, orderBy: { orderIndex: 'asc' } },
    },
  })
  if (!problem || !problem.isPublished) {
    return res.status(404).json({ error: 'problem not found' })
  }

  const tests: JudgeTest[] = problem.tests.map((t) => ({
    args: t.args as unknown[],
    expected: t.expected,
    isSample: true,
  }))

  const outcome = await judgeSubmission({
    language: body.data.language,
    code: body.data.code,
    functionName: problem.functionName,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    tests,
  })

  const results = outcome.results.map((r) => {
    const test = problem.tests[r.index]
    return {
      ...r,
      args: test ? (test.args as unknown[]) : undefined,
      expected: test?.expected,
    }
  })

  const response: RunSamplesResponse = {
    status: outcome.status,
    runtimeMs: outcome.runtimeMs,
    results,
    userLogs: outcome.userLogs,
  }
  if (outcome.compileError) {
    response.compileError = outcome.compileError
  }
  res.json(response)
})

problemsRouter.post('/:slug/submit', requireUser, judgeLimiter, async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'authentication required' })
  }

  const body = submitBodySchema.safeParse(req.body)
  if (!body.success) {
    return res.status(400).json({ error: 'invalid input' })
  }

  const slug = String(req.params.slug)
  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: { tests: { orderBy: { orderIndex: 'asc' } } },
  })
  if (!problem || !problem.isPublished) {
    return res.status(404).json({ error: 'problem not found' })
  }

  const tests: JudgeTest[] = problem.tests.map((t) => ({
    args: t.args as unknown[],
    expected: t.expected,
    isSample: t.isSample,
  }))

  const outcome = await judgeSubmission({
    language: body.data.language,
    code: body.data.code,
    functionName: problem.functionName,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    tests,
  })

  const passedCount = outcome.results.filter((r) => r.ok).length

  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      problemId: problem.id,
      language: LANGUAGE_TO_DB[body.data.language],
      code: body.data.code,
      status: STATUS_TO_DB[outcome.status],
      runtimeMs: outcome.runtimeMs,
      failedTestIndex: outcome.failedTest?.index ?? null,
      error: outcome.error ?? outcome.compileError ?? null,
    },
    select: { id: true },
  })

  const response: SubmitResponse = {
    submissionId: submission.id,
    status: outcome.status,
    runtimeMs: outcome.runtimeMs,
    passedCount,
    totalCount: problem.tests.length,
    failedIndex: outcome.failedTest?.index ?? null,
    userLogs: outcome.userLogs,
  }
  if (outcome.failedTest?.got !== undefined) {
    response.got = outcome.failedTest.got
  }
  if (outcome.failedTest?.error) {
    response.error = outcome.failedTest.error
  }
  if (outcome.compileError) {
    response.compileError = outcome.compileError
  } else if (outcome.error && !response.error) {
    response.error = outcome.error
  }
  res.json(response)
})
