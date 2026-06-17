import type {
  BackupDocument,
  CollectionBackup,
  ImportDoc,
  ImportMode,
} from '@shared/types/transfer'
import type { CollectionReference, Firestore } from 'firebase-admin/firestore'
import { getDb } from './clientManager'
import { assertWritable } from './guard'
import { fromPlainData, toPlainData } from './mapper'

/** Maximum operations per Firestore batched write. */
const BATCH_LIMIT = 500

/**
 * Import documents into a collection in batched writes.
 *
 * @param connectionId - Target connection.
 * @param collectionPath - Destination collection path.
 * @param docs - Documents to write (markers are revived to Firestore types).
 * @param mode - `overwrite` replaces, `merge` deep-merges existing fields.
 * @returns The number of documents written.
 * @throws If the connection is read-only.
 */
export async function importDocuments(
  connectionId: string,
  collectionPath: string,
  docs: ImportDoc[],
  mode: ImportMode
): Promise<number> {
  await assertWritable(connectionId)
  const db = await getDb(connectionId)
  const collection = db.collection(collectionPath)
  const merge = mode === 'merge'
  for (let start = 0; start < docs.length; start += BATCH_LIMIT) {
    const batch = db.batch()
    for (const doc of docs.slice(start, start + BATCH_LIMIT)) {
      const ref = doc.id ? collection.doc(doc.id) : collection.doc()
      batch.set(ref, fromPlainData(doc.data, db), { merge })
    }
    await batch.commit()
  }
  return docs.length
}

/**
 * Recursively read a collection and all nested sub-collections into a backup.
 *
 * @param connectionId - Target connection.
 * @param collectionPath - Collection to back up.
 * @returns The recursive collection backup.
 */
export async function readCollectionTree(
  connectionId: string,
  collectionPath: string
): Promise<CollectionBackup> {
  const db = await getDb(connectionId)
  return readCollection(db, db.collection(collectionPath), collectionPath)
}

/**
 * Read one collection level and recurse into each document's sub-collections.
 *
 * @param db - Firestore instance.
 * @param collection - The collection reference to read.
 * @param path - The collection's path.
 * @returns The collection's documents with nested sub-collections.
 */
async function readCollection(
  db: Firestore,
  collection: CollectionReference,
  path: string
): Promise<CollectionBackup> {
  const snap = await collection.get()
  const documents: BackupDocument[] = []
  for (const doc of snap.docs) {
    const subRefs = await doc.ref.listCollections()
    const subcollections = await Promise.all(
      subRefs.map((sub) => readCollection(db, sub, sub.path))
    )
    documents.push({ id: doc.id, data: toPlainData(doc.data()), subcollections })
  }
  return { path, documents }
}

/**
 * Recursively restore a collection backup, writing documents and their
 * sub-collections back to their original paths.
 *
 * @param connectionId - Target connection.
 * @param backup - The backup produced by {@link readCollectionTree}.
 * @param mode - `overwrite` replaces, `merge` deep-merges existing fields.
 * @returns The total number of documents written.
 * @throws If the connection is read-only.
 */
export async function restoreCollectionTree(
  connectionId: string,
  backup: CollectionBackup,
  mode: ImportMode
): Promise<number> {
  await assertWritable(connectionId)
  const db = await getDb(connectionId)
  return writeCollection(db, backup, mode)
}

/**
 * Write one backup collection level and recurse into sub-collections.
 *
 * @param db - Firestore instance.
 * @param backup - The collection backup to write.
 * @param mode - Write mode (overwrite or merge).
 * @returns The number of documents written at and below this level.
 */
async function writeCollection(
  db: Firestore,
  backup: CollectionBackup,
  mode: ImportMode
): Promise<number> {
  const collection = db.collection(backup.path)
  const merge = mode === 'merge'
  let written = 0
  for (const doc of backup.documents) {
    await collection.doc(doc.id).set(fromPlainData(doc.data, db), { merge })
    written += 1
    for (const sub of doc.subcollections) written += await writeCollection(db, sub, mode)
  }
  return written
}
