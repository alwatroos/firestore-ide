import { useCallback } from 'react'
import type { DocumentRecord } from '@shared/types/firestore'
import { api, unwrap } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'

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
