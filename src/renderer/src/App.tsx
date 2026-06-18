import { useAtomValue, useSetAtom } from 'jotai'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
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
 * Central content area: full-width explorer when no document is open,
 * resizable split between explorer and editor when one is selected.
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

  if (!selectedDocument) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <QueryTabBar />
        <ExplorerPane />
        {aiPanel}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <QueryTabBar />
      <ResizableSplit left={<ExplorerPane />} right={editor} />
      {aiPanel}
    </div>
  )
}

/**
 * Application shell: sidebar and the main content area.
 * Manages the `.dark` class on `<html>` based on the persisted theme setting.
 *
 * @returns The rendered application.
 */
export function App(): ReactNode {
  const active = useAtomValue(activeConnectionAtom)
  const bumpVersion = useSetAtom(documentsVersionAtom)
  const [showSettings, setShowSettings] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const onSaved = useCallback(() => bumpVersion((v) => v + 1), [bumpVersion])
  const settings = useAtomValue(settingsAtom)

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
      <Sidebar
        onOpenSettings={() => setShowSettings(true)}
        onOpenRules={() => setShowRules(true)}
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
