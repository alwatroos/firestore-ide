/** Supported Firestore query comparison operators. */
export type QueryOperator =
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'array-contains'
  | 'in'
  | 'array-contains-any'

/** A single `where` filter applied to a query. */
export interface QueryFilter {
  /** Document field path to filter on. */
  field: string
  /** Comparison operator. */
  operator: QueryOperator
  /** Comparison value (JSON-serialisable). */
  value: unknown
}

/** Optional ordering clause for a query. */
export interface QueryOrder {
  /** Field to order by. */
  field: string
  /** Sort direction. */
  direction: 'asc' | 'desc'
}

/** Declarative query specification evaluated in the main process. */
export interface QuerySpec {
  /** Collection (or sub-collection) path to query. */
  collectionPath: string
  /** Zero or more `where` filters. */
  filters?: QueryFilter[]
  /** Optional ordering clause. */
  order?: QueryOrder
  /** Maximum number of documents to return. */
  limit?: number
}

/** A Firestore document flattened for display and editing. */
export interface DocumentRecord {
  /** Document id (last path segment). */
  id: string
  /** Full document path. */
  path: string
  /** Document fields as a plain JSON-serialisable object. */
  data: Record<string, unknown>
}
