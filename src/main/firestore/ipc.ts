import { IPC } from '@shared/ipc/channels'
import type { DocumentRecord, QuerySpec } from '@shared/types/firestore'
import type { CollectionBackup, ImportDoc, ImportMode } from '@shared/types/transfer'
import { ok } from '@shared/utils/result'
import { handle } from '../core/ipc'
import { loadSettings } from '../settings/store'
import { inferSchema } from './schema'
import {
  deleteDocument,
  getDocument,
  listCollections,
  listDocuments,
  runJsQuery,
  runQuery,
  saveDocument,
} from './service'
import { importDocuments, readCollectionTree, restoreCollectionTree } from './transfer'

/**
 * Register all Firestore-domain IPC handlers.
 *
 * @returns Nothing; side-effect registers handlers on `ipcMain`.
 */
export function registerFirestoreIpc(): void {
  handle(IPC.firestoreListCollections, async (id: string, parentPath?: string) =>
    ok(await listCollections(id, parentPath))
  )
  handle(
    IPC.firestoreListDocuments,
    async (id: string, path: string, limit?: number, offset?: number) =>
      ok(await listDocuments(id, path, limit, offset))
  )
  handle(IPC.firestoreGetDocument, async (id: string, path: string) =>
    ok(await getDocument(id, path))
  )
  handle(IPC.firestoreRunQuery, async (id: string, spec: QuerySpec) => ok(await runQuery(id, spec)))
  handle(IPC.firestoreRunJsQuery, async (id: string, code: string) =>
    ok(await runJsQuery(id, code))
  )
  handle(IPC.firestoreSaveDocument, async (id: string, doc: DocumentRecord) =>
    ok(await saveDocument(id, doc))
  )
  handle(IPC.firestoreDeleteDocument, async (id: string, path: string) => {
    await deleteDocument(id, path)
    return ok(undefined)
  })
  handle(IPC.firestoreGetSchema, async (id: string) =>
    ok(await inferSchema(id, (await loadSettings()).schemaSampleSize))
  )
  handle(
    IPC.firestoreImportDocuments,
    async (id: string, path: string, docs: ImportDoc[], mode: ImportMode) =>
      ok({ written: await importDocuments(id, path, docs, mode) })
  )
  handle(IPC.firestoreReadCollection, async (id: string, path: string) =>
    ok(await readCollectionTree(id, path))
  )
  handle(
    IPC.firestoreRestoreCollection,
    async (id: string, backup: CollectionBackup, mode: ImportMode) =>
      ok({ written: await restoreCollectionTree(id, backup, mode) })
  )
}
