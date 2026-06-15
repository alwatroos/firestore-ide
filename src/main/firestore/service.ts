import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'
import type { DocumentRecord, QuerySpec } from '@shared/types/firestore'
import { getDb } from './clientManager'
import { toPlainData } from './mapper'
import { applySpec, clampLimit } from './queryBuilder'

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
 * List documents within a collection, bounded by a safe limit.
 *
 * @param connectionId - Target connection.
 * @param collectionPath - Collection to read.
 * @param limit - Optional maximum document count.
 * @returns The documents as records.
 */
export async function listDocuments(
  connectionId: string,
  collectionPath: string,
  limit?: number
): Promise<DocumentRecord[]> {
  const db = await getDb(connectionId)
  const snap = await db.collection(collectionPath).limit(clampLimit(limit)).get()
  return snap.docs.map(toRecord)
}

/**
 * Execute a declarative query against a collection.
 *
 * @param connectionId - Target connection.
 * @param spec - Declarative query specification.
 * @returns Matching documents as records.
 */
export async function runQuery(
  connectionId: string,
  spec: QuerySpec
): Promise<DocumentRecord[]> {
  const db = await getDb(connectionId)
  const snap = await applySpec(db.collection(spec.collectionPath), spec).get()
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
  const db = await getDb(connectionId)
  await db.doc(doc.path).set(doc.data)
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
  const db = await getDb(connectionId)
  await db.doc(path).delete()
}
