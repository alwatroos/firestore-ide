import type { QueryOperator, QuerySpec } from '@shared/types/firestore'

/** A single field entry in a Firestore composite index definition. */
export interface IndexField {
  /** Document field path. */
  fieldPath: string
  /** Sort order for scalar fields. */
  order?: 'ASCENDING' | 'DESCENDING'
  /** Array configuration for `array-contains`/`array-contains-any` fields. */
  arrayConfig?: 'CONTAINS'
}

/** A Firestore composite index definition (matches `firestore.indexes.json`). */
export interface IndexDefinition {
  /** Collection id the index applies to. */
  collectionGroup: string
  /** Whether the index covers one collection or a collection group. */
  queryScope: 'COLLECTION' | 'COLLECTION_GROUP'
  /** Ordered index fields. */
  fields: IndexField[]
}

/** Operators that require an array index configuration. */
const ARRAY_OPERATORS: ReadonlySet<QueryOperator> = new Set<QueryOperator>([
  'array-contains',
  'array-contains-any'
])

/**
 * Extract a Firebase console "create index" URL from an error message.
 *
 * @param message - The error message returned by a failed query.
 * @returns The console URL, or `null` when none is present.
 */
export function extractIndexUrl(message: string): string | null {
  const match = message.match(/https?:\/\/console\.firebase\.google\.com\/[^\s)"']+/)
  return match ? match[0] : null
}

/**
 * Heuristically determine whether an error indicates a missing composite index.
 *
 * @param message - The error message returned by a failed query.
 * @returns True when the error looks like a missing-index error.
 */
export function isMissingIndexError(message: string): boolean {
  return /requires an index|FAILED_PRECONDITION/i.test(message) || extractIndexUrl(message) !== null
}

/**
 * Derive a best-effort composite index definition from a query spec. Equality
 * filters come first, then the remaining filter/order fields, de-duplicated by
 * path. This is a proposal — Firestore's own console link is authoritative.
 *
 * @param spec - The query spec that triggered the missing-index error.
 * @returns A composite index definition.
 */
export function buildIndexDefinition(spec: QuerySpec): IndexDefinition {
  const leaf = spec.collectionPath.split('/').pop() ?? spec.collectionPath
  const byPath = new Map<string, IndexField>()

  const equality = (spec.filters ?? []).filter((filter) => filter.operator === '==')
  const others = (spec.filters ?? []).filter((filter) => filter.operator !== '==')

  for (const filter of [...equality, ...others]) {
    if (ARRAY_OPERATORS.has(filter.operator)) byPath.set(filter.field, { fieldPath: filter.field, arrayConfig: 'CONTAINS' })
    else if (!byPath.has(filter.field)) byPath.set(filter.field, { fieldPath: filter.field, order: 'ASCENDING' })
  }

  if (spec.order) {
    byPath.set(spec.order.field, {
      fieldPath: spec.order.field,
      order: spec.order.direction === 'desc' ? 'DESCENDING' : 'ASCENDING'
    })
  }

  return {
    collectionGroup: leaf,
    queryScope: spec.collectionGroup ? 'COLLECTION_GROUP' : 'COLLECTION',
    fields: [...byPath.values()]
  }
}

/**
 * Render a `firestore.indexes.json` snippet containing one proposed index.
 *
 * @param spec - The query spec that triggered the missing-index error.
 * @returns A pretty-printed JSON string ready to copy or save.
 */
export function indexesFileSnippet(spec: QuerySpec): string {
  return JSON.stringify({ indexes: [buildIndexDefinition(spec)] }, null, 2)
}
