import type { ConnectionMeta } from '@shared/types/connection'
import type { ReactNode } from 'react'
import { Empty, ErrorBanner } from '../../components/ui'
import { useConnectionActions, useConnections } from './hooks'

/** Props for a single connection row. */
interface RowProps {
  /** The connection to render. */
  connection: ConnectionMeta
  /** Whether this row is the active connection. */
  active: boolean
  /** Select handler. */
  onSelect: () => void
  /** Remove handler. */
  onRemove: () => void
}

/**
 * Render one selectable connection row with a remove control.
 *
 * @param props - Connection, active flag and handlers.
 * @returns The rendered row.
 */
function ConnectionRow({ connection, active, onSelect, onRemove }: RowProps): ReactNode {
  const activeClass = active
    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
    : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
  return (
    <li className={`flex items-center justify-between rounded border px-2 py-1.5 ${activeClass}`}>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
        <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{connection.name}</div>
        <div className="truncate text-xs text-slate-500 dark:text-slate-400">{connection.projectId}</div>
      </button>
      <button type="button" className="px-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400" onClick={onRemove}>
        ✕
      </button>
    </li>
  )
}

/**
 * Sidebar list of all configured connections.
 *
 * @returns The rendered connection list.
 */
export function ConnectionList(): ReactNode {
  const { connections, activeId, setActiveId, error, refresh } = useConnections()
  const actions = useConnectionActions(refresh)
  if (connections.length === 0) return <Empty text="No connections yet" />
  return (
    <>
      <ErrorBanner message={error ?? actions.error} />
      <ul className="space-y-1 p-2">
        {connections.map((connection) => (
          <ConnectionRow
            key={connection.id}
            connection={connection}
            active={connection.id === activeId}
            onSelect={() => setActiveId(connection.id)}
            onRemove={() => void actions.remove(connection.id)}
          />
        ))}
      </ul>
    </>
  )
}
