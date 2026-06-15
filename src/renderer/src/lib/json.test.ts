import { describe, expect, it } from 'vitest'
import { parseJsonObject } from './json'

describe('parseJsonObject', () => {
  it('accepts a JSON object', () => {
    const result = parseJsonObject('{"a":1}')
    expect(result.ok && result.value.a).toBe(1)
  })

  it('rejects arrays and primitives', () => {
    expect(parseJsonObject('[1]').ok).toBe(false)
    expect(parseJsonObject('42').ok).toBe(false)
  })

  it('rejects malformed JSON', () => {
    expect(parseJsonObject('{').ok).toBe(false)
  })
})
