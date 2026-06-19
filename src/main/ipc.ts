import { registerConnectionIpc } from './connections/ipc';
import { registerFilesIpc } from './files/ipc';
import { registerFirestoreIpc } from './firestore/ipc';
import { registerOllamaIpc } from './ollama/ipc';
import { registerQueriesIpc } from './queries/ipc';
import { registerRulesIpc } from './rules/ipc';
import { registerSettingsIpc } from './settings/ipc';

/**
 * Register every domain's IPC handlers in one place.
 *
 * @returns Nothing; side-effect wires up all `ipcMain` handlers.
 */
export function registerIpc(): void {
  registerConnectionIpc();
  registerFilesIpc();
  registerFirestoreIpc();
  registerOllamaIpc();
  registerQueriesIpc();
  registerRulesIpc();
  registerSettingsIpc();
}
