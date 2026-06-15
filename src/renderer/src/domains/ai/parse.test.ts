import { describe, expect, it } from 'vitest'
import { parseQuerySpec } from './parse'

describe('parseQuerySpec', () => {
  it('normalises a minimal spec', () => {
    const spec = parseQuerySpec('{"collectionPath":"users"}')
    expect(spec.collectionPath).toBe('users')
    expect(spec.filters).toEqual([])
  })

  it('throws when collectionPath is missing', () => {
    expect(() => parseQuerySpec('{}')).toThrow()
  })
})
