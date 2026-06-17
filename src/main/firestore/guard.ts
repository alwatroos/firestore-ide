import { requireConnection } from '../connections/store'
import { loadSettings } from '../settings/store'

/**
 * Determine whether writes are currently blocked for a connection, honouring
 * both the global read-only switch and the per-connection flag.
 *
 * @param connectionId - Target connection.
 * @returns True when any write must be refused.
 */
export async function isReadOnly(connectionId: string): Promise<boolean> {
  const settings = await loadSettings()
  if (settings.readOnly) return true
  const connection = await requireConnection(connectionId)
  return connection.readOnly === true
}

/**
 * Throw if the connection is read-only. Call this in the main process before any
 * write so the protection is enforced at the security boundary, not just in UI.
 *
 * @param connectionId - Target connection.
 * @returns Resolves when writes are permitted.
 * @throws If the global or per-connection read-only flag is set.
 */
export async function assertWritable(connectionId: string): Promise<void> {
  if (await isReadOnly(connectionId)) {
    throw new Error('This connection is read-only. Disable read-only mode to make changes.')
  }
}
