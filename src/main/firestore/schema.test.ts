import { describe, expect, it } from 'vitest'
import { inferFields, valueType } from './schema'

describe('valueType', () => {
  it('classifies common value shapes', () => {
    expect(valueType(null)).toBe('null')
    expect(valueType([1])).toBe('array')
    expect(valueType({ _ref: 'a/b' })).toBe('reference')
    expect(valueType('x')).toBe('string')
  })
})

describe('inferFields', () => {
  it('aggregates observed types and occurrences', () => {
    const fields = inferFields([{ a: 1 }, { a: 'x', b: true }])
    const a = fields.find((field) => field.name === 'a')
    expect(a?.occurrences).toBe(2)
    expect(a?.types.sort()).toEqual(['number', 'string'])
  })
})
