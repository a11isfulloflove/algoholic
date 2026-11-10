import { describe, expect, it } from 'vitest'
import { buildHarness, RESULT_PREFIX } from './harness'

function runHarness(code: string): { results: unknown[]; logs: string[] } {
  const captured: string[] = []
  const fakeConsole = {
    log: (...args: unknown[]) => captured.push(args.map(String).join(' ')),
  }
  const fakeModule = { exports: {} }
  const fn = new Function('module', 'console', code)
  fn(fakeModule, fakeConsole)
  const results = captured
    .filter((line) => line.startsWith(RESULT_PREFIX))
    .map((line) => JSON.parse(line.slice(RESULT_PREFIX.length)))
  const logs = captured.filter((line) => !line.startsWith(RESULT_PREFIX))
  return { results, logs }
}

describe('buildHarness', () => {
  it('runs the exported function against every test and reports got values', () => {
    const userCode = 'function double(x) { return x * 2 }\nmodule.exports = double'
    const harness = buildHarness(userCode, 'double', [{ args: [21] }, { args: [2] }])

    const { results, logs } = runHarness(harness)

    expect(results).toEqual([
      { i: 0, got: 42 },
      { i: 1, got: 4 },
    ])
    expect(logs).toEqual([])
  })

  it('captures per-test errors without stopping the run', () => {
    const userCode =
      'function flaky(i) { if (i === 1) throw new Error("boom"); return i }\nmodule.exports = flaky'
    const harness = buildHarness(userCode, 'flaky', [
      { args: [0] },
      { args: [1] },
      { args: [2] },
    ])

    const { results } = runHarness(harness)

    expect(results).toEqual([
      { i: 0, got: 0 },
      { i: 1, err: 'boom' },
      { i: 2, got: 2 },
    ])
  })

  it('passes user console.log output through as plain lines', () => {
    const userCode =
      'function noisy(x) { console.log("debug:", x); return x }\nmodule.exports = noisy'
    const harness = buildHarness(userCode, 'noisy', [{ args: [7] }])

    const { results, logs } = runHarness(harness)

    expect(results).toEqual([{ i: 0, got: 7 }])
    expect(logs).toEqual(['debug: 7'])
  })

  it('reports a missing export clearly and skips tests', () => {
    const userCode = 'function double(x) { return x * 2 }'
    const harness = buildHarness(userCode, 'double', [{ args: [1] }])

    const { results } = runHarness(harness)

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ i: -1 })
    expect(String((results[0] as { err?: string }).err)).toContain('could not find')
  })

  it('serializes array and object results faithfully', () => {
    const userCode =
      'function pair(a, b) { return [a, b] }\nmodule.exports = pair'
    const harness = buildHarness(userCode, 'pair', [{ args: [3, 9] }])

    const { results } = runHarness(harness)

    expect(results).toEqual([{ i: 0, got: [3, 9] }])
  })

  it('keeps working when user code ends with a line comment', () => {
    const userCode = 'function one() { return 1 } // trailing comment'
    const harness = buildHarness(userCode + '\nmodule.exports = one', 'one', [{ args: [] }])

    const { results } = runHarness(harness)

    expect(results).toEqual([{ i: 0, got: 1 }])
  })
})
