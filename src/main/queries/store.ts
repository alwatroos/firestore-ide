import type { QueryHistoryEntry, SavedQuery } from '@shared/types/queries';
import { readJson, writeJson } from '../core/jsonFile';
import { queriesFile } from '../core/paths';

/** On-disk shape of the queries store. */
export interface QueriesStore {
  /** Most-recent-first execution history. */
  history: QueryHistoryEntry[];
  /** User-named saved queries. */
  saved: SavedQuery[];
}

/** Empty store used when the file does not yet exist. */
const EMPTY: QueriesStore = { history: [], saved: [] };

/**
 * Load the persisted query history and saved queries.
 *
 * @returns The store, or an empty store when none exists.
 */
export async function loadQueries(): Promise<QueriesStore> {
  return { ...EMPTY, ...(await readJson<Partial<QueriesStore>>(queriesFile(), EMPTY)) };
}

/**
 * Persist the query store, overwriting the existing file.
 *
 * @param store - The store to persist.
 * @returns Resolves once written.
 */
export async function persistQueries(store: QueriesStore): Promise<void> {
  await writeJson(queriesFile(), store);
}
