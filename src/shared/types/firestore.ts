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

/** Supported aggregation operations for a query. */
export type QueryAggregate = 'count' | 'sum' | 'avg'

/** Declarative query specification evaluated in the main process. */
export interface QuerySpec {
  /**
   * Collection (or sub-collection) path to query. When `collectionGroup` is set,
   * this must instead be a bare collection id (the leaf segment), not a path.
   */
  collectionPath: string
  /**
   * When true, query every collection with this id across all parents
   * (Firestore collection group query) instead of a single collection path.
   */
  collectionGroup?: boolean
  /** Zero or more `where` filters. */
  filters?: QueryFilter[]
  /** Optional ordering clause (ignored for aggregations). */
  order?: QueryOrder
  /** Maximum number of documents to return (ignored for aggregations). */
  limit?: number
  /** When set, returns an aggregation result instead of documents. */
  aggregate?: QueryAggregate
  /** Field to aggregate — required when `aggregate` is `sum` or `avg`. */
  aggregateField?: string
}

/**
 * Sentinel document id returned by count aggregation queries.
 * Consumers should check `doc.id === COUNT_SENTINEL_ID` to detect this case.
 */
export const COUNT_SENTINEL_ID = '__count__'

/**
 * Field markers used to round-trip Firestore-native types through plain JSON.
 * A marker is an object with exactly one of these keys; this lets the renderer
 * display, and the import/save path revive, types that JSON cannot represent.
 */
export const FIELD_MARKERS = {
  /** ISO-8601 string — Firestore `Timestamp`. */
  timestamp: '_timestamp',
  /** `[latitude, longitude]` tuple — Firestore `GeoPoint`. */
  geopoint: '_geopoint',
  /** Document path string — Firestore `DocumentReference`. */
  reference: '_ref',
  /** Base64 string — Firestore `Bytes`/`Buffer`. */
  bytes: '_bytes',
} as const

/** Marker object for a Firestore `Timestamp` (`{ _timestamp: ISO }`). */
export interface TimestampMarker {
  _timestamp: string
}

/** Marker object for a Firestore `GeoPoint` (`{ _geopoint: [lat, lng] }`). */
export interface GeoPointMarker {
  _geopoint: [number, number]
}

/** Marker object for a `DocumentReference` (`{ _ref: "path" }`). */
export interface ReferenceMarker {
  _ref: string
}

/** Marker object for Firestore `Bytes` (`{ _bytes: base64 }`). */
export interface BytesMarker {
  _bytes: string
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
