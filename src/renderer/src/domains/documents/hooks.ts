import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import type { DocumentRecord } from '@shared/types/firestore'
import { api, unwrap } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { selectedCollectionAtom } from '../explorer/atoms'
import { selectedDocumentAtom } from './atoms'

/**
 * Compute the parent collection path of a document path.
 *
 * @param path - Full document path (e.g. `users/1/orders/2`).
 * @returns The parent collection path (e.g. `users/1/orders`).
 */
function parentCollection(path: string): string {
  return path.split('/').slice(0, -1).join('/')
}

/**
 * Open a document by path: fetch it, select its parent collection and show it in
 * the editor. Used to follow `DocumentReference` fields and tree document nodes.
 *
 * @param connectionId - Active connection id, or `null`.
 * @returns An `open` action plus busy/error state.
 */
export function useOpenDocument(connectionId: string | null) {
  const setDocument = useSetAtom(selectedDocumentAtom)
  const setCollection = useSetAtom(selectedCollectionAtom)
  const { error, busy, run } = useAsync()
  const open = useCallback(
    (path: string) => {
      if (!connectionId) return undefined
      return run(async () => {
        const doc = await unwrap(api.getDocument(connectionId, path))
        if (!doc) throw new Error(`Document not found: ${path}`)
        setCollection(parentCollection(path))
        setDocument(doc)
        return doc
      })
    },
    [connectionId, run, setDocument, setCollection]
  )
  return { open, error, busy }
}

/**
 * Provide save/delete actions for documents, refreshing via `onChange`.
 *
 * @param connectionId - Active connection id, or `null`.
 * @param onChange - Callback run after a successful mutation.
 * @returns Save/remove actions plus their busy/error state.
 */
export function useDocumentMutations(connectionId: string | null, onChange: () => void) {
  const { error, busy, run } = useAsync()
  const save = useCallback(
    (doc: DocumentRecord) => {
      if (!connectionId) return undefined
      return run(async () => {
        await unwrap(api.saveDocument(connectionId, doc))
        onChange()
      })
    },
    [connectionId, run, onChange]
  )
  const remove = useCallback(
    (path: string) => {
      if (!connectionId) return undefined
      return run(async () => {
        await unwrap(api.deleteDocument(connectionId, path))
        onChange()
      })
    },
    [connectionId, run, onChange]
  )
  return { save, remove, error, busy }
}
