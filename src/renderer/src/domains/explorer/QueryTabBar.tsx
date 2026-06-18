import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { type ReactNode, useRef, useState } from 'react'
import {
  activeQueryTabIdAtom,
  addQueryTabAtom,
  closeQueryTabAtom,
  queryTabsAtom,
  renameQueryTabAtom,
} from './atoms'

/** Props for {@link TabItem}. */
interface TabItemProps {
  id: string
  label: string
  isActive: boolean
  isOnly: boolean
  onActivate: () => void
  onClose: () => void
  onRename: (label: string) => void
}

/**
 * A single tab item with label (double-click to rename) and close button.
 *
 * @param props - Tab identity, state, and callbacks.
 * @returns The rendered tab.
 */
function TabItem({
  id: _id,
  label,
  isActive,
  isOnly,
  onActivate,
  onClose,
  onRename,
}: TabItemProps): ReactNode {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setDraft(label)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commit() {
    if (draft.trim()) onRename(draft.trim())
    setEditing(false)
  }

  return (
    <div
      onClick={onActivate}
      className={`flex items-center gap-1 shrink-0 px-3 border-r border-slate-200 dark:border-slate-700 cursor-pointer select-none ${
        isActive
          ? 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-b-2 border-b-blue-500 -mb-px py-[7px]'
          : 'py-2 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="w-24 bg-transparent outline outline-1 outline-blue-400 rounded px-1 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span onDoubleClick={startEdit} className="max-w-32 truncate text-sm">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        disabled={isOnly}
        className="flex h-4 w-4 items-center justify-center rounded text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-0 disabled:pointer-events-none"
        title="Close tab"
        aria-label="Close tab"
      >
        ×
      </button>
    </div>
  )
}

/**
 * Horizontal tab bar for managing multiple independent query tabs.
 * Double-click a label to rename; click × to close; click + to open a new tab.
 *
 * @returns The rendered tab bar.
 */
export function QueryTabBar(): ReactNode {
  const tabs = useAtomValue(queryTabsAtom)
  const [activeId, setActiveId] = useAtom(activeQueryTabIdAtom)
  const addTab = useSetAtom(addQueryTabAtom)
  const closeTab = useSetAtom(closeQueryTabAtom)
  const renameTab = useSetAtom(renameQueryTabAtom)

  return (
    <div className="flex shrink-0 items-stretch border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-x-auto">
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          id={tab.id}
          label={tab.label}
          isActive={tab.id === activeId}
          isOnly={tabs.length === 1}
          onActivate={() => setActiveId(tab.id)}
          onClose={() => closeTab(tab.id)}
          onRename={(label) => renameTab({ id: tab.id, label })}
        />
      ))}
      <button
        type="button"
        onClick={() => addTab()}
        className="shrink-0 px-3 py-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-900 text-xl leading-none"
        title="New tab"
        aria-label="New tab"
      >
        +
      </button>
    </div>
  )
}
