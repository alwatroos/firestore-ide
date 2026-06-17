import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect } from 'react'
import type { ConnectionPatch, NewConnectionInput } from '@shared/types/connection'
import { api, unwrap } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { settingsAtom } from '../settings/atoms'
import { activeConnectionAtom, activeConnectionIdAtom, connectionsAtom } from './atoms'

/**
 * Build a stable action that reloads the connection list into shared state.
 *
 * @returns A memoised refresh callback.
 */
export function useRefreshConnections(): () => Promise<void> {
  const setConnections = useSetAtom(connectionsAtom)
  const { run } = useAsync()
  return useCallback(async () => {
    await run(async () => setConnections(await unwrap(api.listConnections())))
  }, [run, setConnections])
}

/**
 * Load the connection list into state and expose selection helpers.
 *
 * @returns Connections, selection state, loading/error flags and a refresher.
 */
export function useConnections() {
  const [connections, setConnections] = useAtom(connectionsAtom)
  const [activeId, setActiveId] = useAtom(activeConnectionIdAtom)
  const { error, busy, run } = useAsync()
  const refresh = useCallback(
    () => run(async () => setConnections(await unwrap(api.listConnections()))),
    [run, setConnections]
  )
  useEffect(() => void refresh(), [refresh])
  return { connections, activeId, setActiveId, error, busy, refresh }
}

/**
 * Provide create/remove/test actions, invoking `onChange` after mutations.
 *
 * @param onChange - Callback run after a successful add or remove.
 * @returns Mutation actions plus their busy/error state.
 */
export function useConnectionActions(onChange: () => void) {
  const { error, busy, run } = useAsync()
  const add = useCallback(
    (input: NewConnectionInput) =>
      run(async () => {
        await unwrap(api.addConnection(input))
        onChange()
      }),
    [run, onChange]
  )
  const remove = useCallback(
    (id: string) =>
      run(async () => {
        await unwrap(api.removeConnection(id))
        onChange()
      }),
    [run, onChange]
  )
  const update = useCallback(
    (id: string, patch: ConnectionPatch) =>
      run(async () => {
        await unwrap(api.updateConnection(id, patch))
        onChange()
      }),
    [run, onChange]
  )
  const test = useCallback((id: string) => run(() => unwrap(api.testConnection(id))), [run])
  return { add, remove, update, test, error, busy }
}

/**
 * Resolve whether the active connection is currently write-protected, honouring
 * both the global read-only switch and the per-connection flag.
 *
 * @returns True when writes should be blocked in the UI.
 */
export function useReadOnly(): boolean {
  const settings = useAtomValue(settingsAtom)
  const active = useAtomValue(activeConnectionAtom)
  return settings.readOnly || active?.readOnly === true
}
