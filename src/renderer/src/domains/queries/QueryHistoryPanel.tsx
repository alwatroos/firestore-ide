import type { QueryHistoryEntry, SavedQuery } from '@shared/types/queries';
import { useAtomValue } from 'jotai';
import { type ReactNode, useState } from 'react';
import { Button, Empty, ErrorBanner } from '../../components/ui';
import { activeConnectionAtom } from '../connections/atoms';
import { queryDraftAtom, queryModeAtom } from '../explorer/atoms';
import { useLoadQuery, useQueryHistory, useSavedQueries } from './hooks';

/** A short, one-line preview of a query body. */
function preview(query: string): string {
  return query.replace(/\s+/g, ' ').trim().slice(0, 80);
}

/** Saved-queries section: load, delete and save the current draft. */
function SavedSection(): ReactNode {
  const active = useAtomValue(activeConnectionAtom);
  const draft = useAtomValue(queryDraftAtom);
  const mode = useAtomValue(queryModeAtom);
  const { saved, error, save, remove } = useSavedQueries();
  const load = useLoadQuery();
  const [name, setName] = useState('');

  const mine = saved.filter((query) => query.connectionId === active?.id);

  /** Save the current editor draft under the typed name. */
  function onSave(): void {
    if (!active || !draft.trim() || !name.trim()) return;
    void save({ name: name.trim(), connectionId: active.id, kind: mode, query: draft });
    setName('');
  }

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Saved</h3>
      <div className="flex gap-2">
        <input
          placeholder="Name the current query…"
          className="flex-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-200 px-2 py-1 text-sm"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button onClick={onSave} disabled={!active || !draft.trim() || !name.trim()}>
          Save
        </Button>
      </div>
      <ErrorBanner message={error} />
      {mine.length === 0 ? (
        <p className="text-xs text-slate-400">No saved queries yet.</p>
      ) : (
        <ul className="space-y-1">
          {mine.map((query: SavedQuery) => (
            <li
              key={query.id}
              className="flex items-center gap-2 rounded border border-slate-200 dark:border-slate-700 px-2 py-1"
            >
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => load(query.kind, query.query)}
              >
                <div className="truncate text-sm font-medium dark:text-slate-200">{query.name}</div>
                <div className="truncate font-mono text-xs text-slate-400">
                  {query.kind} · {preview(query.query)}
                </div>
              </button>
              <button
                type="button"
                className="px-1 text-xs text-red-500 hover:text-red-700"
                onClick={() => void remove(query.id)}
                aria-label="Delete saved query"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** History section: load any past run back into the editor. */
function HistorySection(): ReactNode {
  const active = useAtomValue(activeConnectionAtom);
  const { history, error } = useQueryHistory();
  const load = useLoadQuery();
  const mine = history.filter((entry) => entry.connectionId === active?.id);

  if (mine.length === 0) return <Empty text="No query history yet" />;
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">History</h3>
      <ErrorBanner message={error} />
      <ul className="space-y-1">
        {mine.map((entry: QueryHistoryEntry) => (
          <li key={entry.id}>
            <button
              type="button"
              className="w-full rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => load(entry.kind, entry.query)}
            >
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  {entry.kind}
                  {entry.instruction ? ` · "${entry.instruction}"` : ''}
                </span>
                <span>
                  {entry.resultCount != null ? `${entry.resultCount} result(s) · ` : ''}
                  {new Date(entry.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="truncate font-mono text-xs dark:text-slate-300">
                {preview(entry.query)}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * History tab: saved queries and recent run history for the active connection.
 * Selecting an entry loads it back into the Query editor.
 *
 * @returns The rendered panel.
 */
export function QueryHistoryPanel(): ReactNode {
  return (
    <div className="h-full space-y-4 overflow-auto p-4">
      <SavedSection />
      <HistorySection />
    </div>
  );
}
