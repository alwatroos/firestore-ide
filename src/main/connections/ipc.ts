import type { ConnectionPatch, NewConnectionInput } from '@shared/types/connection'
import { IPC } from '@shared/ipc/channels'
import { ok } from '@shared/utils/result'
import { handle } from '../core/ipc'
import { disposeClient } from '../firestore/clientManager'
import { testConnection } from '../firestore/connectivity'
import { addConnection, listConnections, removeConnection, updateConnection } from './service'

/**
 * Register all connection-domain IPC handlers.
 *
 * @returns Nothing; side-effect registers handlers on `ipcMain`.
 */
export function registerConnectionIpc(): void {
  handle(IPC.connectionsList, async () => ok(await listConnections()))
  handle(IPC.connectionsAdd, async (input: NewConnectionInput) => ok(await addConnection(input)))
  handle(IPC.connectionsUpdate, async (id: string, patch: ConnectionPatch) =>
    ok(await updateConnection(id, patch))
  )
  handle(IPC.connectionsRemove, async (id: string) => {
    await removeConnection(id)
    await disposeClient(id)
    return ok(undefined)
  })
  handle(IPC.connectionsTest, async (id: string) => ok(await testConnection(id)))
}
