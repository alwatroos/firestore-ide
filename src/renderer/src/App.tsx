import { useAtomValue, useSetAtom } from 'jotai'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ResizableSplit } from './components/ResizableSplit'
import { Sidebar } from './components/Sidebar'
import { AiQueryPanel } from './domains/ai/AiQueryPanel'
import { activeConnectionAtom } from './domains/connections/atoms'
import { selectedDocumentAtom } from './domains/documents/atoms'
import { DocumentEditor } from './domains/documents/DocumentEditor'
import { activeQueryTabIdAtom, documentsVersionAtom } from './domains/explorer/atoms'
import { ExplorerPane } from './domains/explorer/ExplorerPane'
import { QueryTabBar } from './domains/explorer/QueryTabBar'
import { RulesDialog } from './domains/rules/RulesDialog'
import { settingsAtom } from './domains/settings/atoms'
import { SettingsDialog } from './domains/settings/SettingsDialog'

/** Props for {@link MainContent}. */
interface MainContentProps {
  /** Active connection id passed to the document editor. */
  connectionId: string | null
  /** Invoked after a successful save or delete. */
  onSaved: () => void
  /** Opens the settings dialog from the AI panel. */
  onOpenSettings: () => void
}

/**
 * Central content area: explorer and AI panel in a vertical resizable split.
 * When a document is selected the explorer itself becomes a horizontal split.
 *
 * @param props - Connection id, save callback and settings opener.
 * @returns The rendered content area.
 */
function MainContent({ connectionId, onSaved, onOpenSettings }: MainContentProps): ReactNode {
  const selectedDocument = useAtomValue(selectedDocumentAtom)
  const activeTabId = useAtomValue(activeQueryTabIdAtom)
  const editor = <DocumentEditor connectionId={connectionId} onSaved={onSaved} />
  // key forces a fresh component instance (and fresh hooks) for each tab while
  // the per-tab atoms preserve the instruction/draft/stream state across switches.
  const aiPanel = <AiQueryPanel key={activeTabId} onOpenSettings={onOpenSettings} />

  const explorerContent = selectedDocument ? (
    <ResizableSplit left={<ExplorerPane />} right={editor} />
  ) : (
    <ExplorerPane />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <QueryTabBar />
      <ResizableSplit direction="vertical" top={explorerContent} bottom={aiPanel} minHeight={80} />
    </div>
  )
}

/**
 * Hook that manages sidebar drag-to-resize behaviour.
 * Registers global mousemove/mouseup listeners while a drag is in progress.
 *
 * @param collapsed - Whether the sidebar is currently collapsed.
 * @param onExpand - Called when a drag gesture should auto-expand the sidebar.
 * @returns Current sidebar pixel width and a mousedown starter for the divider.
 */
function useSidebarResize(
  collapsed: boolean,
  onExpand: () => void
): { width: number; startDividerDrag: () => void } {
  const [width, setWidth] = useState(288)
  const dragging = useRef(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const newWidth = Math.max(160, Math.min(e.clientX, 480))
      setWidth(newWidth)
      if (collapsed && newWidth > 160) onExpand()
    }
    const onUp = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [collapsed, onExpand])

  const startDividerDrag = useCallback(() => {
    dragging.current = true
  }, [])

  return { width, startDividerDrag }
}

/**
 * Application shell: collapsible/resizable sidebar and the main content area.
 * Manages the `.dark` class on `<html>` based on the persisted theme setting.
 *
 * @returns The rendered application.
 */
export function App(): ReactNode {
  const active = useAtomValue(activeConnectionAtom)
  const bumpVersion = useSetAtom(documentsVersionAtom)
  const [showSettings, setShowSettings] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const onSaved = useCallback(() => bumpVersion((v) => v + 1), [bumpVersion])
  const settings = useAtomValue(settingsAtom)

  const expandSidebar = useCallback(() => setSidebarCollapsed(false), [])
  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), [])
  const { width: sidebarWidth, startDividerDrag } = useSidebarResize(
    sidebarCollapsed,
    expandSidebar
  )

  useEffect(() => {
    const root = document.documentElement
    if (settings.theme === 'dark') {
      root.classList.add('dark')
      return
    }
    if (settings.theme === 'light') {
      root.classList.remove('dark')
      return
    }
    // system: follow prefers-color-scheme and keep in sync
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    root.classList.toggle('dark', mq.matches)
    const handler = (e: MediaQueryListEvent) => root.classList.toggle('dark', e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  return (
    <div className="flex h-screen text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <div
        style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
        className="shrink-0 overflow-hidden transition-[width] duration-150"
      >
        <Sidebar
          onOpenSettings={() => setShowSettings(true)}
          onOpenRules={() => setShowRules(true)}
          onToggle={toggleSidebar}
        />
      </div>
      <SidebarDivider
        collapsed={sidebarCollapsed}
        onMouseDown={startDividerDrag}
        onExpand={() => setSidebarCollapsed(false)}
      />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <MainContent
          connectionId={active?.id ?? null}
          onSaved={onSaved}
          onOpenSettings={() => setShowSettings(true)}
        />
      </main>
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showRules && (
        <RulesDialog connectionId={active?.id ?? null} onClose={() => setShowRules(false)} />
      )}
    </div>
  )
}

/**
 * The 1px drag divider between the sidebar and main content.
 * Shows a small expand tab when the sidebar is collapsed.
 *
 * @param props - Collapsed state, mousedown handler and expand callback.
 * @returns The rendered divider.
 */
function SidebarDivider({
  collapsed,
  onMouseDown,
  onExpand,
}: {
  collapsed: boolean
  onMouseDown: () => void
  onExpand: () => void
}): ReactNode {
  return (
    <div
      className="relative w-1 shrink-0 cursor-col-resize bg-slate-200 dark:bg-slate-700 transition-colors hover:bg-blue-400 active:bg-blue-600"
      onMouseDown={onMouseDown}
    >
      {collapsed && (
        <button
          type="button"
          className="absolute top-8 left-full flex h-6 w-4 items-center justify-center rounded-r-md bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs hover:bg-blue-400 hover:text-white z-10 select-none"
          onClick={onExpand}
          onMouseDown={(e) => e.stopPropagation()}
          title="Expand sidebar"
        >
          ›
        </button>
      )}
    </div>
  )
}
