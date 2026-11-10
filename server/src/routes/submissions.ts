import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db'
import { requireUser } from '../auth/middleware'
import type {
  Language,
  SubmissionListResponse,
  SubmissionStatus,
  SubmissionSummary,
} from '@algoholic/shared'

export const submissionsRouter = Router()

submissionsRouter.use(requireUser)

const LANGUAGE_FROM_DB: Record<string, Language> = {
  JAVASCRIPT: 'javascript',
  TYPESCRIPT: 'typescript',
}

const STATUS_FROM_DB: Record<string, SubmissionStatus> = {
  ACCEPTED: 'accepted',
  WRONG_ANSWER: 'wrong_answer',
  TIME_LIMIT: 'time_limit',
  RUNTIME_ERROR: 'runtime_error',
  COMPILE_ERROR: 'compile_error',
  INTERNAL_ERROR: 'internal_error',
}

interface SubmissionRow {
  id: number
  language: string
  status: string
  runtimeMs: number | null
  createdAt: Date
  code?: string
  problem: { slug: string; title: string }
}

function toSummary(row: SubmissionRow): SubmissionSummary {
  return {
    id: row.id,
    problemSlug: row.problem.slug,
    problemTitle: row.problem.title,
    language: LANGUAGE_FROM_DB[row.language] ?? 'javascript',
    status: STATUS_FROM_DB[row.status] ?? 'internal_error',
    runtimeMs: row.runtimeMs,
    createdAt: row.createdAt.toISOString(),
  }
}

const listQuerySchema = z.object({
  problem: z
    .string()
    .trim()
    .min(1)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
})

submissionsRouter.get('/', async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'authentication required' })
  }

  const parsed = listQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid query parameters' })
  }

  const { problem, page, pageSize } = parsed.data
  const where = {
    userId: user.id,
    ...(problem ? { problem: { slug: problem } } : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { problem: { select: { slug: true, title: true } } },
    }),
  ])

  const body: SubmissionListResponse = {
    items: rows.map(toSummary),
    total,
    page,
    pageSize,
  }
  res.json(body)
})

submissionsRouter.get('/:id', async (req, res) => {
  const user = req.user
  if (!user) {
    return res.status(401).json({ error: 'authentication required' })
  }

  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: 'invalid submission id' })
  }

  const row = await prisma.submission.findFirst({
    where: { id, userId: user.id },
    include: { problem: { select: { slug: true, title: true } } },
  })
  if (!row) {
    return res.status(404).json({ error: 'submission not found' })
  }

  res.json({ ...toSummary(row), code: row.code })
})
