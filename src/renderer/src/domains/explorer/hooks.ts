import type { DocumentRecord, QuerySpec } from '@shared/types/firestore'
import { type PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { api, unwrap } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { collectionsAtom, documentsAtom, documentsVersionAtom, sessionCostAtom } from './atoms'
import { addCost, type CostTotals, estimateReads } from './cost'

/** Number of documents fetched per page in the Browse tab. */
const PAGE_SIZE = 50

/**
 * Expose a callback that adds estimated operations to the session cost tally.
 *
 * @returns A function accepting a partial {@link CostTotals} delta.
 */
export function useCostTracker(): (delta: Partial<CostTotals>) => void {
  const setCost = useSetAtom(sessionCostAtom)
  return useCallback(
    (delta: Partial<CostTotals>) => setCost((prev) => addCost(prev, delta)),
    [setCost]
  )
}

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
 * Load documents for the selected collection with offset-based "load more" pagination.
 * The `version` atom is included in `refresh`'s identity so mutations trigger an automatic reload.
 *
 * @param connectionId - Active connection id, or `null`.
 * @param collectionPath - Selected collection path, or `null`.
 * @returns Documents, loading/error state, a full refresher and a `loadMore` action.
 */
export function useDocuments(connectionId: string | null, collectionPath: string | null) {
  const [documents, setDocuments] = useAtom(documentsAtom)
  const version = useAtomValue(documentsVersionAtom)
  const { error, busy, run } = useAsync()
  const [hasMore, setHasMore] = useState(true)
  const trackCost = useCostTracker()

  // `version` is intentionally captured so that when mutations bump it, this
  // callback gets a new identity, which re-triggers the effect below.
  const refresh = useCallback(() => {
    void version
    if (!connectionId || !collectionPath) return undefined
    return run(async () => {
      const docs = await unwrap(api.listDocuments(connectionId, collectionPath, PAGE_SIZE))
      setDocuments(docs)
      setHasMore(docs.length >= PAGE_SIZE)
      trackCost({ reads: Math.max(1, docs.length) })
    })
  }, [connectionId, collectionPath, run, setDocuments, version, trackCost])

  const loadMore = useCallback(() => {
    if (!connectionId || !collectionPath) return undefined
    return run(async () => {
      const next = await unwrap(
        api.listDocuments(connectionId, collectionPath, PAGE_SIZE, documents.length)
      )
      setDocuments((prev) => [...prev, ...next])
      setHasMore(next.length >= PAGE_SIZE)
      trackCost({ reads: Math.max(1, next.length) })
    })
  }, [connectionId, collectionPath, documents.length, run, setDocuments, trackCost])

  useEffect(() => {
    setDocuments([])
    setHasMore(true)
    void refresh()
  }, [refresh, setDocuments])

  return { documents, error, busy, refresh, loadMore, hasMore }
}

/**
 * Run an AI- or hand-authored query and load the results into a target atom.
 *
 * @param connectionId - Active connection id, or `null`.
 * @param target - Jotai atom to write results into (defaults to the Browse atom).
 * @returns A `runSpec` action plus loading/error state.
 */
export function useQueryRunner(
  connectionId: string | null,
  target: PrimitiveAtom<DocumentRecord[]> = documentsAtom
) {
  const setDocuments = useAtom(target)[1]
  const { error, busy, run } = useAsync()
  const trackCost = useCostTracker()
  const runSpec = useCallback(
    (spec: QuerySpec): Promise<DocumentRecord[] | undefined> => {
      if (!connectionId) return Promise.resolve(undefined)
      return run(async () => {
        const docs = await unwrap(api.runQuery(connectionId, spec))
        setDocuments(docs)
        trackCost({ reads: estimateReads(docs) })
        return docs
      })
    },
    [connectionId, run, setDocuments, trackCost]
  )
  return { runSpec, error, busy }
}
