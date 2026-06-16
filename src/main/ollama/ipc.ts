import type { GenerateQueryInput } from '@shared/types/ollama'
import { IPC } from '@shared/ipc/channels'
import { ok } from '@shared/utils/result'
import { handle } from '../core/ipc'
import { listModels } from './client'
import { generateQuery } from './service'

/**
 * Register all Ollama-domain IPC handlers.
 *
 * @returns Nothing; side-effect registers handlers on `ipcMain`.
 */
export function registerOllamaIpc(): void {
  handle(IPC.ollamaListModels, async (host: string) => ok(await listModels(host)))
  handle(IPC.ollamaGenerateQuery, async (input: GenerateQueryInput) =>
    ok(await generateQuery(input))
  )
}
