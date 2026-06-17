import { IPC } from '@shared/ipc/channels'
import type { FileFilter } from '@shared/types/files'
import { ok } from '@shared/utils/result'
import { handle } from '../core/ipc'
import { openFile, saveFile } from './service'

/**
 * Register file save/open IPC handlers (native dialogs live in the main process).
 *
 * @returns Nothing; side-effect registers handlers on `ipcMain`.
 */
export function registerFilesIpc(): void {
  handle(IPC.filesSave, async (name: string, content: string, filters?: FileFilter[]) =>
    ok(await saveFile(name, content, filters))
  )
  handle(IPC.filesOpen, async (filters?: FileFilter[]) => ok(await openFile(filters)))
}
