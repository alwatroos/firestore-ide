import type { QueryHistoryEntry, SavedQuery } from '@shared/types/queries'
import { atom } from 'jotai'

/** Recorded query history, most recent first. */
export const queryHistoryAtom = atom<QueryHistoryEntry[]>([])

/** User-named saved queries. */
export const savedQueriesAtom = atom<SavedQuery[]>([])
