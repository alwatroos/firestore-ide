import type { DocumentRecord } from '@shared/types/firestore'
import { atom } from 'jotai'

/** The document currently open in the editor, or `null`. */
export const selectedDocumentAtom = atom<DocumentRecord | null>(null)
