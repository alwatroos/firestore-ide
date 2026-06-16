import type { GenerateQueryInput } from '@shared/types/ollama'
import { IPC } from '@shared/ipc/channels'
import { ok, toMessage } from '@shared/utils/result'
import { ipcMain } from 'electron'
import { handle } from '../core/ipc'
import { listModels } from './client'
import { generateQuery, generateQueryStream } from './service'

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

  ipcMain.on(IPC.ollamaGenerateQueryStream, async (event, input: GenerateQueryInput) => {
    try {
      const result = await generateQueryStream(input, (chunk) => {
        if (!event.sender.isDestroyed()) event.sender.send(IPC.ollamaStreamChunk, chunk)
      })
      if (!event.sender.isDestroyed()) event.sender.send(IPC.ollamaStreamDone, result)
    } catch (error) {
      if (!event.sender.isDestroyed()) {
        event.sender.send(IPC.ollamaStreamError, toMessage(error))
      }
    }
  })
}
