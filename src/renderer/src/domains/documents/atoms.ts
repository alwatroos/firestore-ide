import type { DocumentRecord } from '@shared/types/firestore'
import { atom } from 'jotai'
import { activeQueryTabIdAtom, queryTabsAtom } from '../explorer/atoms'

type SetStateAction<T> = T | ((prev: T) => T)

function resolve<T>(action: SetStateAction<T>, prev: T): T {
  return typeof action === 'function' ? (action as (p: T) => T)(prev) : action
}

/**
 * The document currently open in the editor for the active tab, or `null`.
 * Accepts a direct value or an updater function (PrimitiveAtom-compatible).
 */
export const selectedDocumentAtom = atom(
  (get) => {
    const tabs = get(queryTabsAtom)
    const id = get(activeQueryTabIdAtom)
    return (tabs.find((t) => t.id === id) ?? tabs[0]).selectedDocument
  },
  (get, set, action: SetStateAction<DocumentRecord | null>) => {
    const id = get(activeQueryTabIdAtom)
    set(queryTabsAtom, (tabs) =>
      tabs.map((t) =>
        t.id === id ? { ...t, selectedDocument: resolve(action, t.selectedDocument) } : t
      )
    )
  }
)
