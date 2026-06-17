import { COUNT_SENTINEL_ID, type DocumentRecord, type QuerySpec } from '@shared/types/firestore'
import {
  AggregateField,
  FieldValue,
  Timestamp,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot
} from 'firebase-admin/firestore'
import { getDb } from './clientManager'
import { assertWritable } from './guard'
import { fromPlainData, toPlainData } from './mapper'
import { applyFiltersOnly, applySpec, clampLimit } from './queryBuilder'

/**
 * Validate that a path points at a document (even segment count), not a collection.
 *
 * @param path - Slash-delimited Firestore path.
 * @throws If the path does not address a document.
 */
function assertDocumentPath(path: string): void {
  const segments = path.split('/').filter(Boolean)
  if (segments.length === 0 || segments.length % 2 !== 0) {
    throw new Error(`Not a document path: ${path}`)
  }
}


/**
 * Map a Firestore snapshot to a renderer-safe {@link DocumentRecord}.
 *
 * @param doc - A queried document snapshot.
 * @returns The flattened document record.
 */
function toRecord(doc: QueryDocumentSnapshot): DocumentRecord {
  return { id: doc.id, path: doc.ref.path, data: toPlainData(doc.data()) }
}

/**
 * Resolve the base query for a spec: a single collection, or a collection group
 * spanning every collection with the given id.
 *
 * @param db - Firestore instance.
 * @param spec - The query spec (its `collectionGroup` flag selects the mode).
 * @returns The base query to which filters/order/limit are applied.
 * @throws If a collection group id is given as a multi-segment path.
 */
function baseQuery(db: Firestore, spec: QuerySpec): Query {
  if (!spec.collectionGroup) return db.collection(spec.collectionPath)
  if (spec.collectionPath.includes('/')) {
    throw new Error('Collection group queries take a collection id, not a path')
  }
  return db.collectionGroup(spec.collectionPath)
}

/**
 * Run a COUNT aggregation and return a single synthetic document record.
 *
 * @param connectionId - Target connection.
 * @param spec - Query spec whose `collectionPath` and `filters` are applied.
 * @returns An array containing one record with `{ count: N }` as its data.
 */
async function runCountQuery(connectionId: string, spec: QuerySpec): Promise<DocumentRecord[]> {
  const db = await getDb(connectionId)
  const base = applyFiltersOnly(baseQuery(db, spec), spec)
  const snap = await base.count().get()
  return [{ id: COUNT_SENTINEL_ID, path: COUNT_SENTINEL_ID, data: { count: snap.data().count } }]
}

/**
 * Run a SUM aggregation over a numeric field and return a synthetic record.
 *
 * @param connectionId - Target connection.
 * @param spec - Query spec; `aggregateField` must be set.
 * @returns An array containing one record with `{ sum: N }` as its data.
 */
async function runSumQuery(connectionId: string, spec: QuerySpec): Promise<DocumentRecord[]> {
  if (!spec.aggregateField) throw new Error('aggregateField is required for sum aggregation')
  const db = await getDb(connectionId)
  const base = applyFiltersOnly(baseQuery(db, spec), spec)
  const snap = await base.aggregate({ result: AggregateField.sum(spec.aggregateField) }).get()
  return [{ id: COUNT_SENTINEL_ID, path: COUNT_SENTINEL_ID, data: { sum: snap.data().result } }]
}

/**
 * Run an AVERAGE aggregation over a numeric field and return a synthetic record.
 *
 * @param connectionId - Target connection.
 * @param spec - Query spec; `aggregateField` must be set.
 * @returns An array containing one record with `{ avg: N }` as its data.
 */
async function runAvgQuery(connectionId: string, spec: QuerySpec): Promise<DocumentRecord[]> {
  if (!spec.aggregateField) throw new Error('aggregateField is required for avg aggregation')
  const db = await getDb(connectionId)
  const base = applyFiltersOnly(baseQuery(db, spec), spec)
  const snap = await base.aggregate({ result: AggregateField.average(spec.aggregateField) }).get()
  return [{ id: COUNT_SENTINEL_ID, path: COUNT_SENTINEL_ID, data: { avg: snap.data().result } }]
}

/**
 * Execute a user-supplied JS snippet against Firestore with a 10-second timeout.
 * The snippet receives `db`, `FieldValue` and `Timestamp` and must return an array
 * of `{ id, path, data }` objects.
 *
 * @param connectionId - Target connection.
 * @param code - JavaScript body (run inside an async IIFE).
 * @returns Document records produced by the snippet.
 */
export async function runJsQuery(
  connectionId: string,
  code: string
): Promise<DocumentRecord[]> {
  // JS snippets can perform writes, so block them entirely while read-only.
  await assertWritable(connectionId)
  const db = await getDb(connectionId)
  // Intentional use of Function constructor — this is a user REPL in a local desktop app.
  // eslint-disable-next-line no-new-func
  const fn = new Function(
    'db', 'FieldValue', 'Timestamp',
    `return (async () => {\n${code}\n})()`
  ) as (db: unknown, fv: unknown, ts: unknown) => Promise<unknown>
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('JS query timed out after 10 seconds')), 10_000)
  )
  const result = await Promise.race([fn(db, FieldValue, Timestamp), timeout])
  if (!Array.isArray(result)) {
    throw new Error('JS query must return an array of {id, path, data} objects')
  }
  return result as DocumentRecord[]
}

/**
 * List collection ids at the database root or under a document.
 *
 * @param connectionId - Target connection.
 * @param parentPath - Optional document path whose sub-collections to list.
 * @returns Collection ids.
 */
export async function listCollections(
  connectionId: string,
  parentPath?: string
): Promise<string[]> {
  const db = await getDb(connectionId)
  const refs = parentPath ? await db.doc(parentPath).listCollections() : await db.listCollections()
  return refs.map((ref) => ref.id)
}

/**
 * List documents within a collection, bounded by a safe limit with optional offset.
 *
 * @param connectionId - Target connection.
 * @param collectionPath - Collection to read.
 * @param limit - Optional maximum document count (clamped to 1–500).
 * @param offset - Optional number of documents to skip.
 * @returns The documents as records.
 */
export async function listDocuments(
  connectionId: string,
  collectionPath: string,
  limit?: number,
  offset?: number
): Promise<DocumentRecord[]> {
  const db = await getDb(connectionId)
  let q = db.collection(collectionPath).limit(clampLimit(limit))
  if (offset && offset > 0) q = q.offset(offset)
  const snap = await q.get()
  return snap.docs.map(toRecord)
}

/**
 * Fetch a single document by its full path.
 *
 * @param connectionId - Target connection.
 * @param path - Full document path (even number of segments).
 * @returns The document record, or `null` when it does not exist.
 */
export async function getDocument(
  connectionId: string,
  path: string
): Promise<DocumentRecord | null> {
  assertDocumentPath(path)
  const db = await getDb(connectionId)
  const snap = await db.doc(path).get()
  if (!snap.exists) return null
  return { id: snap.id, path: snap.ref.path, data: toPlainData(snap.data() ?? {}) }
}

/**
 * Execute a declarative query against a collection.
 * When `spec.aggregate === 'count'`, returns a single synthetic count record.
 *
 * @param connectionId - Target connection.
 * @param spec - Declarative query specification.
 * @returns Matching documents as records, or a count record.
 */
export async function runQuery(
  connectionId: string,
  spec: QuerySpec
): Promise<DocumentRecord[]> {
  if (spec.aggregate === 'count') return runCountQuery(connectionId, spec)
  if (spec.aggregate === 'sum') return runSumQuery(connectionId, spec)
  if (spec.aggregate === 'avg') return runAvgQuery(connectionId, spec)
  const db = await getDb(connectionId)
  const snap = await applySpec(baseQuery(db, spec), spec).get()
  return snap.docs.map(toRecord)
}

/**
 * Create or fully overwrite a document.
 *
 * @param connectionId - Target connection.
 * @param doc - Document path and data to persist.
 * @returns The saved document record.
 */
export async function saveDocument(
  connectionId: string,
  doc: DocumentRecord
): Promise<DocumentRecord> {
  await assertWritable(connectionId)
  const db = await getDb(connectionId)
  await db.doc(doc.path).set(fromPlainData(doc.data, db))
  return doc
}

/**
 * Delete a document by path.
 *
 * @param connectionId - Target connection.
 * @param path - Full document path.
 * @returns Resolves once deleted.
 */
export async function deleteDocument(connectionId: string, path: string): Promise<void> {
  await assertWritable(connectionId)
  const db = await getDb(connectionId)
  await db.doc(path).delete()
}
