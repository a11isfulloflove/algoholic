import { describe, expect, it } from 'vitest'
import { transpile } from './transpile'

describe('transpile', () => {
  it('transpiles typescript to common js', () => {
    const result = transpile(
      'export function double(x: number): number { return x * 2 }',
      'typescript',
    )

    expect(result.ok).toBe(true)
    expect(result.code).toContain('double')
  })

  it('reports typescript syntax errors with location', () => {
    const bad = transpile('function broken( { return 1 }', 'typescript')
    expect(bad.ok).toBe(false)
    expect(bad.error).toMatch(/\d+:\d+/)
  })

  it('acts as a syntax gate for javascript', () => {
    const bad = transpile('function broken( { return 1 }', 'javascript')
    expect(bad.ok).toBe(false)
    expect(bad.error).toBeTruthy()
  })

  it('accepts valid javascript untouched in semantics', () => {
    const result = transpile('function ok() { return 42 }\nmodule.exports = ok', 'javascript')
    expect(result.ok).toBe(true)
  })
})
