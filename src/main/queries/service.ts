import { randomUUID } from 'node:crypto'
import type {
  QueryHistoryEntry,
  RecordQueryInput,
  SavedQuery,
  SaveQueryInput,
} from '@shared/types/queries'
import { loadQueries, persistQueries } from './store'

/** Maximum number of history entries retained. */
const HISTORY_LIMIT = 100

/**
 * Record a query execution at the head of the history, trimming to the cap.
 *
 * @param input - The query, kind, connection and optional metadata.
 * @returns The created history entry.
 */
export async function recordQuery(input: RecordQueryInput): Promise<QueryHistoryEntry> {
  const store = await loadQueries()
  const entry: QueryHistoryEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  store.history = [entry, ...store.history].slice(0, HISTORY_LIMIT)
  await persistQueries(store)
  return entry
}

/**
 * List recorded query history, most recent first.
 *
 * @returns The history entries.
 */
export async function listHistory(): Promise<QueryHistoryEntry[]> {
  return (await loadQueries()).history
}

/**
 * Save a named query.
 *
 * @param input - Name, connection, kind and query body.
 * @returns The created saved query.
 */
export async function saveQuery(input: SaveQueryInput): Promise<SavedQuery> {
  const store = await loadQueries()
  const saved: SavedQuery = { id: randomUUID(), createdAt: new Date().toISOString(), ...input }
  store.saved = [saved, ...store.saved]
  await persistQueries(store)
  return saved
}

/**
 * List saved queries, most recently saved first.
 *
 * @returns The saved queries.
 */
export async function listSaved(): Promise<SavedQuery[]> {
  return (await loadQueries()).saved
}

/**
 * Delete a saved query by id.
 *
 * @param id - The saved query id.
 * @returns Resolves once removed.
 */
export async function deleteSaved(id: string): Promise<void> {
  const store = await loadQueries()
  store.saved = store.saved.filter((query) => query.id !== id)
  await persistQueries(store)
}
