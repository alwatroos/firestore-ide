import type { StoredConnection } from '@shared/types/connection'
import { connectionsFile } from '../core/paths'
import { readJson, writeJson } from '../core/jsonFile'

/**
 * Load all persisted connections from disk.
 *
 * @returns The stored connections, or an empty list when none exist.
 */
export async function loadConnections(): Promise<StoredConnection[]> {
  return readJson<StoredConnection[]>(connectionsFile(), [])
}

/**
 * Persist the full set of connections, overwriting the existing file.
 *
 * @param connections - Connections to persist.
 * @returns Resolves once written to disk.
 */
export async function persistConnections(connections: StoredConnection[]): Promise<void> {
  await writeJson(connectionsFile(), connections)
}

/**
 * Find a stored connection by id or throw a descriptive error.
 *
 * @param id - Connection id to look up.
 * @returns The matching stored connection.
 * @throws If no connection with the given id exists.
 */
export async function requireConnection(id: string): Promise<StoredConnection> {
  const found = (await loadConnections()).find((c) => c.id === id)
  if (!found) throw new Error(`Connection not found: ${id}`)
  return found
}
