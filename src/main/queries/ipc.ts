import { IPC } from '@shared/ipc/channels'
import type { RecordQueryInput, SaveQueryInput } from '@shared/types/queries'
import { ok } from '@shared/utils/result'
import { handle } from '../core/ipc'
import { deleteSaved, listHistory, listSaved, recordQuery, saveQuery } from './service'

/**
 * Register query-history and saved-query IPC handlers.
 *
 * @returns Nothing; side-effect registers handlers on `ipcMain`.
 */
export function registerQueriesIpc(): void {
  handle(IPC.queriesListHistory, async () => ok(await listHistory()))
  handle(IPC.queriesRecord, async (input: RecordQueryInput) => ok(await recordQuery(input)))
  handle(IPC.queriesListSaved, async () => ok(await listSaved()))
  handle(IPC.queriesSave, async (input: SaveQueryInput) => ok(await saveQuery(input)))
  handle(IPC.queriesDeleteSaved, async (id: string) => {
    await deleteSaved(id)
    return ok(undefined)
  })
}
