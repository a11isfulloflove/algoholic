import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { judgeSubmission, type JudgeTest } from '../src/judge/judge'

const prisma = new PrismaClient()

async function main() {
  const problems = await prisma.problem.findMany({
    where: { isPublished: true, solutionJs: { not: null } },
    include: { tests: { orderBy: { orderIndex: 'asc' } } },
  })
  console.log(`[verify] judging ${problems.length} reference solutions…\n`)

  let passed = 0
  const failures: string[] = []

  for (const p of problems) {
    const tests: JudgeTest[] = p.tests.map((t) => ({
      args: t.args as unknown[],
      expected: t.expected,
      isSample: t.isSample,
    }))
    const outcome = await judgeSubmission({
      language: 'javascript',
      code: p.solutionJs as string,
      functionName: p.functionName,
      timeLimitMs: p.timeLimitMs,
      memoryLimitMb: p.memoryLimitMb,
      tests,
    })
    if (outcome.status === 'accepted') {
      passed += 1
      console.log(`  ✓ ${p.slug}`)
    } else {
      const detail =
        outcome.compileError ? outcome.compileError.slice(0, 160)
        : outcome.error ? outcome.error.slice(0, 160)
        : outcome.failedTest ? `failed test #${outcome.failedTest.index + 1}`
        : 'unknown'
      failures.push(`${p.slug}: ${outcome.status} — ${detail}`)
      console.log(`  ✗ ${p.slug}: ${outcome.status} — ${detail}`)
    }
  }

  console.log(`\n[verify] ${passed}/${problems.length} reference solutions accepted`)
  if (failures.length > 0) {
    process.exitCode = 1
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
