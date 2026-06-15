import { useAtom, useAtomValue } from 'jotai'
import { useCallback, useEffect } from 'react'
import type { DocumentRecord, QuerySpec } from '@shared/types/firestore'
import { api, unwrap } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { collectionsAtom, documentsAtom, documentsVersionAtom } from './atoms'

/**
 * Load collection ids for a connection, refreshing when it changes.
 *
 * @param connectionId - Active connection id, or `null`.
 * @returns Collections plus loading/error state and a refresher.
 */
export function useCollections(connectionId: string | null) {
  const [collections, setCollections] = useAtom(collectionsAtom)
  const { error, busy, run } = useAsync()
  const refresh = useCallback(() => {
    if (!connectionId) return undefined
    return run(async () => setCollections(await unwrap(api.listCollections(connectionId))))
  }, [connectionId, run, setCollections])
  useEffect(() => {
    setCollections([])
    void refresh()
  }, [refresh, setCollections])
  return { collections, error, busy, refresh }
}

/**
 * Load documents for the selected collection, refreshing on changes.
 *
 * @param connectionId - Active connection id, or `null`.
 * @param collectionPath - Selected collection path, or `null`.
 * @returns Documents plus loading/error state and a refresher.
 */
export function useDocuments(connectionId: string | null, collectionPath: string | null) {
  const [documents, setDocuments] = useAtom(documentsAtom)
  const version = useAtomValue(documentsVersionAtom)
  const { error, busy, run } = useAsync()
  const refresh = useCallback(() => {
    if (!connectionId || !collectionPath) return undefined
    return run(async () =>
      setDocuments(await unwrap(api.listDocuments(connectionId, collectionPath)))
    )
  }, [connectionId, collectionPath, run, setDocuments])
  useEffect(() => {
    setDocuments([])
    void refresh()
  }, [refresh, setDocuments, version])
  return { documents, error, busy, refresh }
}

/**
 * Run an AI- or hand-authored query and load the results into state.
 *
 * @param connectionId - Active connection id, or `null`.
 * @returns A `runSpec` action plus loading/error state.
 */
export function useQueryRunner(connectionId: string | null) {
  const setDocuments = useAtom(documentsAtom)[1]
  const { error, busy, run } = useAsync()
  const runSpec = useCallback(
    (spec: QuerySpec): Promise<DocumentRecord[] | undefined> => {
      if (!connectionId) return Promise.resolve(undefined)
      return run(async () => {
        const docs = await unwrap(api.runQuery(connectionId, spec))
        setDocuments(docs)
        return docs
      })
    },
    [connectionId, run, setDocuments]
  )
  return { runSpec, error, busy }
}
