import type { DocumentRecord } from '@shared/types/firestore'
import { atom } from 'jotai'
import { type CostTotals, ZERO_COST } from './cost'


/** Available tabs in the explorer pane. */
export type ExplorerTab = 'browse' | 'query'

/** Collection ids available for the active connection. */
export const collectionsAtom = atom<string[]>([])

/** Currently selected collection path, or `null`. */
export const selectedCollectionAtom = atom<string | null>(null)

/** Documents loaded for the selected collection. */
export const documentsAtom = atom<DocumentRecord[]>([])

/** Monotonic counter bumped to force a document reload after mutations. */
export const documentsVersionAtom = atom(0)

/** Currently active tab in the explorer pane. */
export const activeTabAtom = atom<ExplorerTab>('browse')

/** Documents returned by the last manual or AI-generated query. */
export const queryResultsAtom = atom<DocumentRecord[]>([])

/** Editor mode in the Query tab: JSON spec or raw JS snippet. */
export const queryModeAtom = atom<'json' | 'js'>('json')

/** Estimated Firestore operations accrued during this session. */
export const sessionCostAtom = atom<CostTotals>(ZERO_COST)
