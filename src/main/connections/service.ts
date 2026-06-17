import { randomUUID } from 'node:crypto'
import type {
  ConnectionMeta,
  ConnectionPatch,
  NewConnectionInput,
  StoredConnection,
} from '@shared/types/connection'
import { decryptSecret, encryptSecret } from './crypto'
import { parseServiceAccount, type ServiceAccount, toMeta } from './serialize'
import { loadConnections, persistConnections, requireConnection } from './store'

/**
 * List all connections as renderer-safe metadata.
 *
 * @returns Secret-free metadata for every stored connection.
 */
export async function listConnections(): Promise<ConnectionMeta[]> {
  return (await loadConnections()).map(toMeta)
}

/**
 * Register a new connection, encrypting its service account at rest.
 *
 * @param input - User-provided name and raw service account JSON.
 * @returns The created connection's secret-free metadata.
 */
export async function addConnection(input: NewConnectionInput): Promise<ConnectionMeta> {
  const account = parseServiceAccount(input.serviceAccountJson)
  const record = buildRecord(input.name, account, input.serviceAccountJson)
  await persistConnections([...(await loadConnections()), record])
  return toMeta(record)
}

/**
 * Apply a secret-free patch (name, read-only flag) to a connection.
 * Credentials are never touched, so secrets cannot be injected via patch.
 *
 * @param id - Connection id to update.
 * @param patch - Fields to change.
 * @returns The updated connection's secret-free metadata.
 * @throws If no connection with the given id exists.
 */
export async function updateConnection(
  id: string,
  patch: ConnectionPatch
): Promise<ConnectionMeta> {
  const connections = await loadConnections()
  const index = connections.findIndex((c) => c.id === id)
  if (index === -1) throw new Error(`Connection not found: ${id}`)
  const current = connections[index]
  const updated: StoredConnection = {
    ...current,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.readOnly !== undefined ? { readOnly: patch.readOnly } : {}),
  }
  connections[index] = updated
  await persistConnections(connections)
  return toMeta(updated)
}

/**
 * Remove a connection by id.
 *
 * @param id - Connection id to delete.
 * @returns Resolves once the connection has been removed.
 */
export async function removeConnection(id: string): Promise<void> {
  const remaining = (await loadConnections()).filter((c) => c.id !== id)
  await persistConnections(remaining)
}

/**
 * Decrypt and parse the service account credentials for a connection.
 *
 * @param id - Connection id.
 * @returns The decrypted, parsed service account.
 */
export async function getCredentials(id: string): Promise<ServiceAccount> {
  const stored = await requireConnection(id)
  return parseServiceAccount(decryptSecret(stored.encryptedCredentials))
}

/**
 * Build a fully-populated stored connection record from validated inputs.
 *
 * @param name - Display name.
 * @param account - Parsed service account.
 * @param rawJson - Original service account JSON to encrypt.
 * @returns A persistable connection record.
 */
function buildRecord(name: string, account: ServiceAccount, rawJson: string): StoredConnection {
  return {
    id: randomUUID(),
    name,
    projectId: account.project_id,
    clientEmail: account.client_email,
    createdAt: new Date().toISOString(),
    encryptedCredentials: encryptSecret(rawJson),
  }
}
