import { describe, expect, it } from 'vitest'
import type { DatabaseSchema } from '@shared/types/schema'
import { buildMessages, describeSchema } from './prompt'

const schema: DatabaseSchema = {
  projectId: 'p',
  collections: [
    { path: 'users', sampleSize: 1, fields: [{ name: 'age', types: ['number'], occurrences: 1 }] }
  ]
}

describe('describeSchema', () => {
  it('includes collection paths and field types', () => {
    const text = describeSchema(schema)
    expect(text).toContain('users')
    expect(text).toContain('age: number')
  })
})

describe('buildMessages', () => {
  it('returns a system prompt and the user instruction', () => {
    const messages = buildMessages(schema, 'find old users')
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[1].content).toBe('find old users')
  })
})
