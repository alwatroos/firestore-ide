import type { QuerySpec } from '@shared/types/firestore'
import { describe, expect, it } from 'vitest'
import {
  buildIndexDefinition,
  extractIndexUrl,
  indexesFileSnippet,
  isMissingIndexError,
} from './indexes'

const indexUrl =
  'https://console.firebase.google.com/v1/r/project/p/firestore/indexes?create_composite=abc'

describe('extractIndexUrl', () => {
  it('pulls the console URL out of an error message', () => {
    expect(extractIndexUrl(`The query requires an index. Create it here: ${indexUrl}`)).toBe(
      indexUrl
    )
  })

  it('returns null when no URL is present', () => {
    expect(extractIndexUrl('some other error')).toBeNull()
  })
})

describe('isMissingIndexError', () => {
  it('detects missing-index errors', () => {
    expect(isMissingIndexError(`FAILED_PRECONDITION: requires an index ${indexUrl}`)).toBe(true)
  })

  it('is false for unrelated errors', () => {
    expect(isMissingIndexError('permission denied')).toBe(false)
  })
})

describe('buildIndexDefinition', () => {
  it('orders equality fields before inequality/order fields', () => {
    const spec: QuerySpec = {
      collectionPath: 'users',
      filters: [
        { field: 'age', operator: '>', value: 18 },
        { field: 'active', operator: '==', value: true },
      ],
      order: { field: 'createdAt', direction: 'desc' },
    }
    const def = buildIndexDefinition(spec)
    expect(def.collectionGroup).toBe('users')
    expect(def.queryScope).toBe('COLLECTION')
    expect(def.fields.map((f) => f.fieldPath)).toEqual(['active', 'age', 'createdAt'])
    expect(def.fields[2]).toEqual({ fieldPath: 'createdAt', order: 'DESCENDING' })
  })

  it('uses CONTAINS config for array operators and COLLECTION_GROUP scope', () => {
    const spec: QuerySpec = {
      collectionPath: 'orders',
      collectionGroup: true,
      filters: [{ field: 'tags', operator: 'array-contains', value: 'x' }],
    }
    const def = buildIndexDefinition(spec)
    expect(def.queryScope).toBe('COLLECTION_GROUP')
    expect(def.fields[0]).toEqual({ fieldPath: 'tags', arrayConfig: 'CONTAINS' })
  })

  it('derives the collection id from a sub-collection path', () => {
    expect(buildIndexDefinition({ collectionPath: 'users/1/orders' }).collectionGroup).toBe(
      'orders'
    )
  })
})

describe('indexesFileSnippet', () => {
  it('wraps the definition in an indexes array', () => {
    const snippet = JSON.parse(indexesFileSnippet({ collectionPath: 'users' }))
    expect(snippet).toEqual({
      indexes: [{ collectionGroup: 'users', queryScope: 'COLLECTION', fields: [] }],
    })
  })
})
