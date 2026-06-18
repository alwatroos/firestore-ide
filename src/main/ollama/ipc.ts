import { IPC, streamChannels } from '@shared/ipc/channels'
import type { GenerateQueryInput } from '@shared/types/ollama'
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

  ipcMain.on(
    IPC.ollamaGenerateQueryStream,
    async (event, input: GenerateQueryInput, streamId: string) => {
      const ch = streamChannels(streamId)
      try {
        const result = await generateQueryStream(input, (chunk) => {
          if (!event.sender.isDestroyed()) event.sender.send(ch.chunk, chunk)
        })
        if (!event.sender.isDestroyed()) event.sender.send(ch.done, result)
      } catch (error) {
        if (!event.sender.isDestroyed()) event.sender.send(ch.error, toMessage(error))
      }
    }
  )
}
