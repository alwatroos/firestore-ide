import type { FirestoreIdeApi } from '@shared/types/api'
import type { Result } from '@shared/types/result'

/** The preload-exposed backend API. */
export const api: FirestoreIdeApi = window.api

/**
 * Unwrap a {@link Result}, throwing its sanitised error when unsuccessful.
 *
 * @template T - The success payload type.
 * @param promise - A pending IPC result.
 * @returns The success payload.
 * @throws If the result represents a failure.
 */
export async function unwrap<T>(promise: Promise<Result<T>>): Promise<T> {
  const result = await promise
  if (!result.ok) throw new Error(result.error)
  return result.data
}
