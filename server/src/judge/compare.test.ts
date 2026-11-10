import { describe, expect, it } from 'vitest'
import { deepEqual } from './compare'

describe('deepEqual', () => {
  it('matches primitives of the same value', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual('a', 'a')).toBe(true)
    expect(deepEqual(true, true)).toBe(true)
    expect(deepEqual(null, null)).toBe(true)
  })

  it('rejects different primitives', () => {
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual('a', 'b')).toBe(false)
    expect(deepEqual(true, false)).toBe(false)
  })

  it('strictly separates types even when loosely equal', () => {
    expect(deepEqual(1, true)).toBe(false)
    expect(deepEqual(0, false)).toBe(false)
    expect(deepEqual('', false)).toBe(false)
    expect(deepEqual(null, undefined)).toBe(false)
    expect(deepEqual(0, null)).toBe(false)
  })

  it('allows floating point noise within relative tolerance', () => {
    expect(deepEqual(0.1 + 0.2, 0.3)).toBe(true)
    expect(deepEqual(1e-10, 0)).toBe(true)
    expect(deepEqual(1000000.0000001, 1000000)).toBe(true)
  })

  it('rejects numbers beyond tolerance', () => {
    expect(deepEqual(1, 1.001)).toBe(false)
    expect(deepEqual(0.1 + 0.2, 0.4)).toBe(false)
  })

  it('compares arrays with order sensitivity', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(deepEqual([1, 2, 3], [3, 2, 1])).toBe(false)
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
    expect(deepEqual([], [])).toBe(true)
  })

  it('compares nested structures deeply', () => {
    expect(deepEqual([[1, 2], { a: 1 }], [[1, 2], { a: 1 }])).toBe(true)
    expect(deepEqual([[1, 2], { a: 1 }], [[1, 2], { a: 2 }])).toBe(false)
    expect(deepEqual([{ x: { y: [1] } }], [{ x: { y: [1] } }])).toBe(true)
    expect(deepEqual([{ x: { y: [1] } }], [{ x: { y: [2] } }])).toBe(false)
  })

  it('ignores object key order', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    expect(deepEqual({ a: 1, b: { c: 3, d: 4 } }, { b: { d: 4, c: 3 }, a: 1 })).toBe(true)
  })

  it('detects missing and extra keys', () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    expect(deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false)
  })

  it('handles mixed nested arrays and objects with type strictness', () => {
    expect(deepEqual([1, [true]], [1, [1]])).toBe(false)
    expect(deepEqual({ a: [null] }, { a: [0] })).toBe(false)
  })
})
