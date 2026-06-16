import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useState, type ReactNode } from 'react'
import { Sidebar } from './components/Sidebar'
import { AiQueryPanel } from './domains/ai/AiQueryPanel'
import { activeConnectionAtom } from './domains/connections/atoms'
import { DocumentEditor } from './domains/documents/DocumentEditor'
import { documentsVersionAtom } from './domains/explorer/atoms'
import { DocumentTable } from './domains/explorer/DocumentTable'
import { SettingsDialog } from './domains/settings/SettingsDialog'

/**
 * Application shell: sidebar, document table, editor and AI assistant.
 *
 * @returns The rendered application.
 */
export function App(): ReactNode {
  const active = useAtomValue(activeConnectionAtom)
  const bumpVersion = useSetAtom(documentsVersionAtom)
  const [showSettings, setShowSettings] = useState(false)
  const onSaved = useCallback(() => bumpVersion((value) => value + 1), [bumpVersion])

  return (
    <div className="flex h-screen text-slate-800">
      <Sidebar onOpenSettings={() => setShowSettings(true)} />
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          <div className="w-1/2 border-r border-slate-200">
            <DocumentTable />
          </div>
          <div className="w-1/2">
            <DocumentEditor connectionId={active?.id ?? null} onSaved={onSaved} />
          </div>
        </div>
        <AiQueryPanel />
      </main>
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    </div>
  )
}
