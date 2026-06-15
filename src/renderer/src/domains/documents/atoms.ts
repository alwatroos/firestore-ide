import { atom } from 'jotai'
import type { DocumentRecord } from '@shared/types/firestore'

/** The document currently open in the editor, or `null`. */
export const selectedDocumentAtom = atom<DocumentRecord | null>(null)
