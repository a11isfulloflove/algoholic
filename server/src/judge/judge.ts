import type { Language, SubmissionStatus, TestCaseResult } from '@algoholic/shared'
import { transpile } from './transpile'
import { buildHarness, RESULT_PREFIX } from './harness'
import { executeNode } from './piston-client'
import { deepEqual } from './compare'

export interface JudgeTest {
  args: unknown[]
  expected: unknown
  isSample: boolean
}

export interface FailedTestInfo {
  index: number
  isSample: boolean
  got?: unknown
  error?: string
}

export interface JudgeOutcome {
  status: SubmissionStatus
  runtimeMs: number | null
  compileError?: string
  error?: string
  userLogs: string
  results: TestCaseResult[]
  failedTest: FailedTestInfo | null
}

const OVERHEAD_MS = 1500
const MAX_RUN_MS = 9500
const MEMORY_FLOOR_BYTES = 512 * 1024 * 1024
const USER_LOGS_MAX_CHARS = 10000

interface HarnessLine {
  i: number
  got?: unknown
  err?: string
}

function parseStdout(stdout: string): { lines: HarnessLine[]; userLogs: string } {
  const lines: HarnessLine[] = []
  const logLines: string[] = []
  for (const line of stdout.split('\n')) {
    if (line.startsWith(RESULT_PREFIX)) {
      try {
        lines.push(JSON.parse(line.slice(RESULT_PREFIX.length)) as HarnessLine)
      } catch {
        logLines.push(line)
      }
    } else if (line.trim() !== '') {
      logLines.push(line)
    }
  }
  const userLogs = logLines.join('\n').slice(0, USER_LOGS_MAX_CHARS)
  return { lines, userLogs }
}

function internalOutcome(error: string): JudgeOutcome {
  return {
    status: 'internal_error',
    runtimeMs: null,
    error,
    userLogs: '',
    results: [],
    failedTest: null,
  }
}

export async function judgeSubmission(input: {
  language: Language
  code: string
  functionName: string
  timeLimitMs: number
  memoryLimitMb: number
  tests: JudgeTest[]
}): Promise<JudgeOutcome> {
  const transpiled = transpile(input.code, input.language)
  if (!transpiled.ok) {
    return {
      status: 'compile_error',
      runtimeMs: null,
      compileError: transpiled.error,
      userLogs: '',
      results: [],
      failedTest: null,
    }
  }

  const harness = buildHarness(transpiled.code, input.functionName, input.tests)
  const runTimeoutMs = Math.min(input.timeLimitMs + OVERHEAD_MS, MAX_RUN_MS)
  const memoryLimitBytes = Math.max(input.memoryLimitMb * 1024 * 1024, MEMORY_FLOOR_BYTES)

  let response
  try {
    response = await executeNode({
      files: [{ name: 'main.js', content: harness }],
      runTimeoutMs,
      memoryLimitBytes,
    })
  } catch (err) {
    return internalOutcome(`judge unavailable: ${(err as Error).message}`)
  }

  const run = response.run
  const runtimeMs = typeof run.wall_time === 'number' ? run.wall_time : null
  const { lines, userLogs } = parseStdout(run.stdout)

  const initFailure = lines.find((l) => l.i === -1)
  if (initFailure) {
    return {
      status: 'runtime_error',
      runtimeMs,
      error: initFailure.err,
      userLogs,
      results: [],
      failedTest: null,
    }
  }

  const timedOut = run.status === 'TO'
  const crashed = !timedOut && run.code !== 0

  const results: TestCaseResult[] = []
  let failedTest: FailedTestInfo | null = null
  let firstFailureIsException = false
  let firstFailureIsMissing = false

  for (let i = 0; i < input.tests.length; i++) {
    const test = input.tests[i]
    const line = lines.find((l) => l.i === i)

    if (!line) {
      results.push({
        index: i,
        ok: false,
        isSample: test.isSample,
        notRun: true,
        error: timedOut ? 'time limit exceeded' : 'program terminated before this test',
      })
      if (!failedTest) {
        failedTest = { index: i, isSample: test.isSample }
        firstFailureIsMissing = true
      }
      continue
    }

    if (line.err) {
      results.push({
        index: i,
        ok: false,
        isSample: test.isSample,
        got: line.got,
        error: line.err,
      })
      if (!failedTest) {
        failedTest = { index: i, isSample: test.isSample, got: line.got, error: line.err }
        firstFailureIsException = true
      }
      continue
    }

    const ok = deepEqual(line.got, test.expected)
    results.push({ index: i, ok, isSample: test.isSample, got: line.got })
    if (!ok && !failedTest) {
      failedTest = { index: i, isSample: test.isSample, got: line.got }
    }
  }

  let status: SubmissionStatus
  if (timedOut) {
    status = 'time_limit'
  } else if (crashed) {
    status = 'runtime_error'
  } else if (failedTest && (firstFailureIsException || firstFailureIsMissing)) {
    status = 'runtime_error'
  } else if (failedTest) {
    status = 'wrong_answer'
  } else {
    status = 'accepted'
  }

  const crashError = crashed
    ? (run.stderr || run.message || `process exited with code ${run.code}`).slice(0, 500)
    : undefined

  return {
    status,
    runtimeMs,
    error: crashError,
    userLogs,
    results,
    failedTest,
  }
}
