import type { DocumentRecord } from '@shared/types/firestore'
import { describe, expect, it } from 'vitest'
import { collectColumns, formatCell } from './columns'

const docs: DocumentRecord[] = [
  { id: '1', path: 'c/1', data: { a: 1, b: 2 } },
  { id: '2', path: 'c/2', data: { b: 3, c: 4 } },
]

describe('collectColumns', () => {
  it('unions field names across documents', () => {
    expect(collectColumns(docs)).toEqual(['a', 'b', 'c'])
  })

  it('respects the maximum column count', () => {
    expect(collectColumns(docs, 2)).toEqual(['a', 'b'])
  })
})

describe('formatCell', () => {
  it('stringifies objects and blanks nullish values', () => {
    expect(formatCell({ x: 1 })).toBe('{"x":1}')
    expect(formatCell(null)).toBe('')
  })
})
