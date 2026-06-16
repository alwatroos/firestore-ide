import type { ReactNode } from 'react'
import { AddConnectionForm } from '../domains/connections/AddConnectionForm'
import { ConnectionList } from '../domains/connections/ConnectionList'
import { CollectionList } from '../domains/explorer/CollectionList'
import { Button } from './ui'

/**
 * A titled sidebar section wrapper.
 *
 * @param props - Section title and content.
 * @returns The rendered section.
 */
function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <section>
      <h2 className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  )
}

/**
 * Left navigation: connections, the add-connection form and collections.
 *
 * @param props - `onOpenSettings` opens the settings dialog.
 * @returns The rendered sidebar.
 */
export function Sidebar({ onOpenSettings }: { onOpenSettings: () => void }): ReactNode {
  return (
    <aside className="flex w-72 flex-col border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-3 py-2">
        <h1 className="text-sm font-bold text-slate-700 dark:text-slate-300">Firestore IDE</h1>
        <Button variant="ghost" onClick={onOpenSettings} aria-label="Settings">
          ⚙
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <Section title="Connections">
          <ConnectionList />
        </Section>
        <AddConnectionForm />
        <Section title="Collections">
          <CollectionList />
        </Section>
      </div>
    </aside>
  )
}
