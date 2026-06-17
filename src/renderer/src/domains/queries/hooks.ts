import type { QueryKind, RecordQueryInput, SaveQueryInput } from '@shared/types/queries'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useEffect } from 'react'
import { api, unwrap } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { activeTabAtom, queryDraftAtom, queryModeAtom } from '../explorer/atoms'
import { queryHistoryAtom, savedQueriesAtom } from './atoms'

/**
 * Load query history and expose a recorder. History is refreshed after each record.
 *
 * @returns History entries, a refresher and a `record` action.
 */
export function useQueryHistory() {
  const [history, setHistory] = useAtom(queryHistoryAtom)
  const { error, busy, run } = useAsync()
  const refresh = useCallback(
    () => run(async () => setHistory(await unwrap(api.listQueryHistory()))),
    [run, setHistory]
  )
  useEffect(() => void refresh(), [refresh])
  const record = useCallback(
    (input: RecordQueryInput) =>
      run(async () => {
        await unwrap(api.recordQuery(input))
        await refresh()
      }),
    [run, refresh]
  )
  return { history, error, busy, refresh, record }
}

/**
 * Load saved queries and expose save/delete actions.
 *
 * @returns Saved queries, a refresher and save/remove actions.
 */
export function useSavedQueries() {
  const [saved, setSaved] = useAtom(savedQueriesAtom)
  const { error, busy, run } = useAsync()
  const refresh = useCallback(
    () => run(async () => setSaved(await unwrap(api.listSavedQueries()))),
    [run, setSaved]
  )
  useEffect(() => void refresh(), [refresh])
  const save = useCallback(
    (input: SaveQueryInput) =>
      run(async () => {
        await unwrap(api.saveQuery(input))
        await refresh()
      }),
    [run, refresh]
  )
  const remove = useCallback(
    (id: string) =>
      run(async () => {
        await unwrap(api.deleteSavedQuery(id))
        await refresh()
      }),
    [run, refresh]
  )
  return { saved, error, busy, refresh, save, remove }
}

/**
 * Build an action that loads a stored query into the editor and switches tabs.
 * AI-generated specs load into JSON mode.
 *
 * @returns A `load` function taking the kind and query body.
 */
export function useLoadQuery(): (kind: QueryKind, query: string) => void {
  const setDraft = useSetAtom(queryDraftAtom)
  const setMode = useSetAtom(queryModeAtom)
  const setTab = useSetAtom(activeTabAtom)
  return useCallback(
    (kind, query) => {
      setMode(kind === 'js' ? 'js' : 'json')
      setDraft(query)
      setTab('query')
    },
    [setDraft, setMode, setTab]
  )
}
