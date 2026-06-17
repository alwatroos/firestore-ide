import type { Result } from '@shared/types/result'
import { err, toMessage } from '@shared/utils/result'
import { ipcMain } from 'electron'

/**
 * Register an IPC handler whose result is always wrapped in a {@link Result},
 * converting any thrown error into a sanitised message for the renderer.
 *
 * @template A - Tuple of handler argument types.
 * @template R - Resolved payload type on success.
 * @param channel - IPC channel name to listen on.
 * @param handler - Async business-logic handler.
 * @returns Nothing; side-effect registers the handler.
 */
export function handle<A extends unknown[], R>(
  channel: string,
  handler: (...args: A) => Promise<Result<R>>
): void {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return await handler(...(args as A))
    } catch (error) {
      return err(toMessage(error))
    }
  })
}
