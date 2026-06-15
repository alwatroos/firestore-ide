import { describe, expect, it } from 'vitest'
import { clampLimit } from './queryBuilder'

describe('clampLimit', () => {
  it('defaults to 50 when unset or invalid', () => {
    expect(clampLimit()).toBe(50)
    expect(clampLimit(0)).toBe(50)
  })

  it('caps at 500', () => {
    expect(clampLimit(9999)).toBe(500)
  })

  it('keeps values within range', () => {
    expect(clampLimit(10)).toBe(10)
  })
})
