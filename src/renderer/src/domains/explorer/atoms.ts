import { atom } from 'jotai'
import type { DocumentRecord } from '@shared/types/firestore'

/** Collection ids available for the active connection. */
export const collectionsAtom = atom<string[]>([])

/** Currently selected collection path, or `null`. */
export const selectedCollectionAtom = atom<string | null>(null)

/** Documents loaded for the selected collection. */
export const documentsAtom = atom<DocumentRecord[]>([])

/** Monotonic counter bumped to force a document reload after mutations. */
export const documentsVersionAtom = atom(0)
