import type { DocumentRecord, QuerySpec } from '@shared/types/firestore'
import { IPC } from '@shared/ipc/channels'
import { ok } from '@shared/utils/result'
import { handle } from '../core/ipc'
import {
  deleteDocument,
  listCollections,
  listDocuments,
  runQuery,
  saveDocument
} from './service'
import { inferSchema } from './schema'
import { loadSettings } from '../settings/store'

/**
 * Register all Firestore-domain IPC handlers.
 *
 * @returns Nothing; side-effect registers handlers on `ipcMain`.
 */
export function registerFirestoreIpc(): void {
  handle(IPC.firestoreListCollections, async (id: string, parentPath?: string) =>
    ok(await listCollections(id, parentPath))
  )
  handle(IPC.firestoreListDocuments, async (id: string, path: string, limit?: number) =>
    ok(await listDocuments(id, path, limit))
  )
  handle(IPC.firestoreRunQuery, async (id: string, spec: QuerySpec) =>
    ok(await runQuery(id, spec))
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
}
