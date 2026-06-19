import type { ReactNode } from 'react';
import { AddConnectionForm } from '../domains/connections/AddConnectionForm';
import { ConnectionList } from '../domains/connections/ConnectionList';
import { CollectionTree } from '../domains/explorer/CollectionTree';
import { Button } from './ui';

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
  );
}

/**
 * Left navigation: connections, the add-connection form and collections.
 * Width is controlled by the parent; this component fills its container.
 *
 * @param props - `onOpenSettings` opens the settings dialog, `onToggle` collapses the sidebar.
 * @returns The rendered sidebar.
 */
export function Sidebar({
  onOpenSettings,
  onOpenRules,
  onToggle,
}: {
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onToggle: () => void;
}): ReactNode {
  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-3 py-2">
        <h1 className="text-sm font-bold text-slate-700 dark:text-slate-300">Firestore IDE</h1>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            onClick={onOpenRules}
            aria-label="Security Rules"
            title="Security Rules"
          >
            🛡
          </Button>
          <Button variant="ghost" onClick={onOpenSettings} aria-label="Settings">
            ⚙
          </Button>
          <Button
            variant="ghost"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            ◀
          </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <Section title="Connections">
          <ConnectionList />
        </Section>
        <AddConnectionForm />
        <Section title="Data">
          <CollectionTree />
        </Section>
      </div>
    </aside>
  );
}
