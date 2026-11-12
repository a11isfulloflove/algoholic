import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { attachUser, requireUser } from '../auth/middleware'
import { judgeSubmission, type JudgeTest } from '../judge/judge'
import { createRateLimiter } from '../rate-limit'
import type {
  Language,
  ProblemDetail,
  ProblemListResponse,
  ProblemSolution,
  RelatedProblemCard,
  RunSamplesResponse,
  SubmitResponse,
} from '@algoholic/shared'

export const problemsRouter = Router()

const listQuerySchema = z.object({
  category: z
    .string()
    .trim()
    .min(1)
    .optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  status: z.enum(['solved', 'unsolved']).optional(),
  q: z
    .string()
    .trim()
    .max(100)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
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

const submitBodySchema = z.object({
  language: z.enum(['javascript', 'typescript']),
  code: z.string().min(1).max(65536),
})

const DIFFICULTY_TO_DB = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' } as const

problemsRouter.get('/', attachUser, async (req, res) => {
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

  const { category, difficulty, status, q, page, pageSize } = parsed.data
  const user = req.user

  if (status && !user) {
    return res.status(400).json({ error: 'the solved/unsolved filter requires logging in' })
  }

  const solvedIds = user
    ? new Set(
        (
          await prisma.submission.findMany({
            where: { userId: user.id, status: 'ACCEPTED' },
            select: { problemId: true },
            distinct: ['problemId'],
          })
        ).map((s) => s.problemId),
      )
    : new Set<number>()

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
    ...(user && status === 'solved'
      ? { submissions: { some: { userId: user.id, status: 'ACCEPTED' as const } } }
      : {}),
    ...(user && status === 'unsolved'
      ? { submissions: { none: { userId: user.id, status: 'ACCEPTED' as const } } }
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
        id: true,
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
      solved: solvedIds.has(p.id),
      category: p.category,
    })),
    total,
    page,
    pageSize,
  }
  res.json(body)
})

problemsRouter.get('/:slug', attachUser, async (req, res) => {
  const problem = await prisma.problem.findUnique({
    where: { slug: String(req.params.slug) },
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

  const user = req.user
  const hints =
    Array.isArray(problem.hints) && problem.hints.length > 0
      ? (problem.hints as string[])
      : null
  const relatedSlugs = Array.isArray(problem.relatedSlugs)
    ? (problem.relatedSlugs as string[])
    : []

  const [testCount, solved, relatedRows, solvedRelatedRows] = await Promise.all([
    prisma.testCase.count({ where: { problemId: problem.id } }),
    user
      ? prisma.submission.findFirst({
          where: { userId: user.id, problemId: problem.id, status: 'ACCEPTED' },
          select: { id: true },
        })
      : null,
    relatedSlugs.length > 0
      ? prisma.problem.findMany({
          where: { slug: { in: relatedSlugs }, isPublished: true },
          select: { slug: true, title: true, difficulty: true },
        })
      : [],
    user && relatedSlugs.length > 0
      ? prisma.submission.findMany({
          where: {
            userId: user.id,
            status: 'ACCEPTED',
            problem: { slug: { in: relatedSlugs } },
          },
          select: { problem: { select: { slug: true } } },
          distinct: ['problemId'],
        })
      : [],
  ])

  const solvedRelatedSlugs = new Set(
    solvedRelatedRows.map((r) => (r.problem as { slug: string }).slug),
  )
  const related: RelatedProblemCard[] = relatedRows
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      difficulty: r.difficulty.toLowerCase() as RelatedProblemCard['difficulty'],
      solved: solvedRelatedSlugs.has(r.slug),
    }))
    .sort((a, b) => relatedSlugs.indexOf(a.slug) - relatedSlugs.indexOf(b.slug))

  const body: ProblemDetail = {
    slug: problem.slug,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty.toLowerCase() as ProblemDetail['difficulty'],
    solved: solved !== null,
    category: problem.category,
    functionName: problem.functionName,
    starterCodeJs: problem.starterCodeJs,
    starterCodeTs: problem.starterCodeTs,
    timeLimitMs: problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
    targetComplexity: problem.targetComplexity,
    hintsCount: hints?.length ?? 0,
    hints: user && hints ? hints : null,
    related,
    samples: problem.tests.map((t) => ({
      args: t.args as unknown[],
      expected: t.expected,
    })),
    testCount,
  }
  res.json(body)
})

problemsRouter.get('/:slug/solution', requireUser, async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'authentication required' })
  }

  const problem = await prisma.problem.findUnique({
    where: { slug: String(req.params.slug) },
    select: { id: true, isPublished: true, solutionJs: true, solutionNotes: true },
  })
  if (!problem || !problem.isPublished || !problem.solutionJs) {
    return res.status(404).json({ error: 'no reference solution available' })
  }

  const accepted = await prisma.submission.findFirst({
    where: { userId: user.id, problemId: problem.id, status: 'ACCEPTED' },
    select: { id: true },
  })
  if (!accepted) {
    return res.status(403).json({ error: 'solve this problem first to unlock the solution' })
  }

  const body: ProblemSolution = {
    solutionJs: problem.solutionJs,
    solutionNotes: problem.solutionNotes,
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
