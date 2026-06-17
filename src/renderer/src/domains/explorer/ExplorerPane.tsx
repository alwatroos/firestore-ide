import { useAtom } from 'jotai'
import type { ReactNode } from 'react'
import { QueryHistoryPanel } from '../queries/QueryHistoryPanel'
import { activeTabAtom, type ExplorerTab } from './atoms'
import { CostBar } from './CostBar'
import { DocumentTable } from './DocumentTable'
import { QueryEditor } from './QueryEditor'

/** Props for {@link TabButton}. */
interface TabButtonProps {
  id: ExplorerTab
  label: string
  active: ExplorerTab
  onClick: (id: ExplorerTab) => void
}

/**
 * A single tab button with active/inactive styling.
 *
 * @param props - Tab id, display label, currently active tab and click handler.
 * @returns The rendered tab button.
 */
function TabButton({ id, label, active, onClick }: TabButtonProps): ReactNode {
  const isActive = active === id
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        isActive
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {label}
    </button>
  )
}

/**
 * Tab bar showing Browse and Query options.
 *
 * @param props - Active tab and change handler.
 * @returns The rendered tab bar.
 */
function TabBar({
  active,
  onChange,
}: {
  active: ExplorerTab
  onChange: (t: ExplorerTab) => void
}): ReactNode {
  return (
    <div className="flex shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
      <TabButton id="browse" label="Browse" active={active} onClick={onChange} />
      <TabButton id="query" label="Query" active={active} onClick={onChange} />
      <TabButton id="history" label="History" active={active} onClick={onChange} />
    </div>
  )
}

/**
 * Render the panel for the active explorer tab.
 *
 * @param props - The active tab.
 * @returns The matching panel.
 */
function TabPanel({ tab }: { tab: ExplorerTab }): ReactNode {
  if (tab === 'browse') return <DocumentTable />
  if (tab === 'query') return <QueryEditor />
  return <QueryHistoryPanel />
}

/**
 * Explorer pane combining the tab bar with the Browse (document table) or Query editor.
 *
 * @returns The rendered explorer pane.
 */
export function ExplorerPane(): ReactNode {
  const [activeTab, setActiveTab] = useAtom(activeTabAtom)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TabBar active={activeTab} onChange={setActiveTab} />
      <div className="min-h-0 flex-1 overflow-hidden">
        <TabPanel tab={activeTab} />
      </div>
      <CostBar />
    </div>
  )
}
