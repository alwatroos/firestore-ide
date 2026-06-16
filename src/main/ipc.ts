import { registerConnectionIpc } from './connections/ipc'
import { registerFirestoreIpc } from './firestore/ipc'
import { registerOllamaIpc } from './ollama/ipc'
import { registerSettingsIpc } from './settings/ipc'

/**
 * Register every domain's IPC handlers in one place.
 *
 * @returns Nothing; side-effect wires up all `ipcMain` handlers.
 */
export function registerIpc(): void {
  registerConnectionIpc()
  registerFirestoreIpc()
  registerOllamaIpc()
  registerSettingsIpc()
}
