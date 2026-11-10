export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const SUBMISSION_STATUSES = [
  'accepted',
  'wrong_answer',
  'time_limit',
  'runtime_error',
  'compile_error',
  'internal_error',
] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

export interface HealthResponse {
  status: 'ok'
}

export interface CategorySummary {
  slug: string
  name: string
  problemCount: number
}

export interface ProblemListItem {
  slug: string
  title: string
  difficulty: Difficulty
  category: {
    slug: string
    name: string
  }
}

export interface ProblemListResponse {
  items: ProblemListItem[]
  total: number
  page: number
  pageSize: number
}

export interface SampleTestCase {
  args: unknown[]
  expected: unknown
}

export interface ProblemDetail {
  slug: string
  title: string
  description: string
  difficulty: Difficulty
  category: {
    slug: string
    name: string
  }
  functionName: string
  starterCodeJs: string
  starterCodeTs: string
  timeLimitMs: number
  memoryLimitMb: number
  samples: SampleTestCase[]
  testCount: number
}

export const LANGUAGES = ['javascript', 'typescript'] as const
export type Language = (typeof LANGUAGES)[number]

export interface TestCaseResult {
  index: number
  ok: boolean
  isSample: boolean
  args?: unknown[]
  expected?: unknown
  got?: unknown
  error?: string
  notRun?: boolean
}

export interface RunSamplesResponse {
  status: SubmissionStatus
  runtimeMs: number | null
  results: TestCaseResult[]
  userLogs: string
  compileError?: string
}

export interface SubmitResponse {
  submissionId: number
  status: SubmissionStatus
  runtimeMs: number | null
  passedCount: number
  totalCount: number
  failedIndex: number | null
  got?: unknown
  error?: string
  userLogs: string
  compileError?: string
}

export interface SubmissionSummary {
  id: number
  problemSlug: string
  problemTitle: string
  language: Language
  status: SubmissionStatus
  runtimeMs: number | null
  createdAt: string
}

export interface SubmissionListResponse {
  items: SubmissionSummary[]
  total: number
  page: number
  pageSize: number
}

export interface SubmissionDetail extends SubmissionSummary {
  code: string
}
