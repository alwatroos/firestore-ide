import { COUNT_SENTINEL_ID, type DocumentRecord, type QuerySpec } from '@shared/types/firestore'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { type ReactNode, useMemo, useState } from 'react'
import { Button, Empty, ErrorBanner, WarningList } from '../../components/ui'
import { api, unwrap } from '../../lib/api'
import { parseJsonObject } from '../../lib/json'
import { useAsync } from '../../lib/useAsync'
import { activeConnectionAtom } from '../connections/atoms'
import { useReadOnly } from '../connections/hooks'
import { selectedDocumentAtom } from '../documents/atoms'
import { useOpenDocument } from '../documents/hooks'
import { useQueryHistory } from '../queries/hooks'
import { queryDraftAtom, queryModeAtom, queryResultsAtom, selectedCollectionAtom } from './atoms'
import { CellValue } from './CellValue'
import { collectColumns } from './columns'
import { estimateReads } from './cost'
import { useQueryRunner } from './hooks'
import { IndexHint } from './IndexHint'
import { isMissingIndexError } from './indexes'
import { queryWarnings } from './queryWarnings'
import { toQuerySpec } from './querySpec'
import { useTransfer } from './useTransfer'

const JSON_PLACEHOLDER = JSON.stringify(
  {
    collectionPath: 'users',
    filters: [{ field: 'active', operator: '==', value: true }],
    order: { field: 'createdAt', direction: 'desc' },
    limit: 50
  },
  null,
  2
)

const JS_PLACEHOLDER = `// Available: db (Firestore Admin SDK), FieldValue, Timestamp
// Must return: Array<{ id: string, path: string, data: Record<string, unknown> }>

const snap = await db.collection('users')
  .where('active', '==', true)
  .orderBy('createdAt', 'desc')
  .limit(50)
  .get()

return snap.docs.map(d => ({ id: d.id, path: d.ref.path, data: d.data() }))`

/** Props for {@link QueryToolbar}. */
interface ToolbarProps {
  mode: 'json' | 'js'
  onModeChange: (m: 'json' | 'js') => void
  onRun: () => void
  busy: boolean
  disabled: boolean
}

/**
 * Toolbar with mode toggle and run button.
 *
 * @param props - Mode, run handler and disabled/busy state.
 * @returns The rendered toolbar.
 */
function QueryToolbar({ mode, onModeChange, onRun, busy, disabled }: ToolbarProps): ReactNode {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Query</span>
        <div className="flex overflow-hidden rounded border border-slate-200 dark:border-slate-600 text-xs">
          {(['json', 'js'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={`px-3 py-1 font-medium transition-colors ${
                mode === m
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {m === 'json' ? 'JSON spec' : 'JS query'}
            </button>
          ))}
        </div>
      </div>
      <Button onClick={onRun} disabled={busy || disabled}>
        {busy ? 'Running…' : 'Run'}
      </Button>
    </div>
  )
}

/** Props for {@link ResultRow}. */
interface ResultRowProps {
  doc: DocumentRecord
  columns: string[]
  onSelect: (doc: DocumentRecord) => void
  onOpenRef: (path: string) => void
}

/**
 * A single result row in the query results table.
 *
 * @param props - Document, columns, selection and reference-follow callbacks.
 * @returns The rendered table row.
 */
function ResultRow({ doc, columns, onSelect, onOpenRef }: ResultRowProps): ReactNode {
  return (
    <tr
      onClick={() => onSelect(doc)}
      className="cursor-pointer border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
    >
      <td className="px-3 py-1.5 font-mono text-slate-500 dark:text-slate-400">{doc.id}</td>
      {columns.map((col) => (
        <td key={col} className="max-w-xs truncate px-3 py-1.5">
          <CellValue value={doc.data[col]} onOpenRef={onOpenRef} />
        </td>
      ))}
    </tr>
  )
}

/**
 * Display query results read from {@link queryResultsAtom}.
 * Shows an aggregation banner for sentinel records, a table for document results.
 *
 * @returns The rendered results section.
 */
function QueryResultsTable(): ReactNode {
  const results = useAtomValue(queryResultsAtom)
  const setDocument = useSetAtom(selectedDocumentAtom)
  const active = useAtomValue(activeConnectionAtom)
  const { open: openRef } = useOpenDocument(active?.id ?? null)
  const { exportRecords, busy: exportBusy } = useTransfer(active?.id ?? null)

  if (results.length === 0) return <Empty text="Run a query to see results" />

  const isSentinel = results.length === 1 && results[0].id === COUNT_SENTINEL_ID
  if (isSentinel) {
    const entries = Object.entries(results[0].data)
    return (
      <div className="flex flex-wrap items-center justify-center gap-6 p-8">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col items-center gap-0.5 text-slate-600 dark:text-slate-400">
            <span className="text-4xl font-bold tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : String(value)}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{key}</span>
          </div>
        ))}
      </div>
    )
  }

  const columns = collectColumns(results)
  return (
    <div className="overflow-auto">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-1.5 text-xs text-slate-400 dark:text-slate-500">
        <span>{results.length} result{results.length !== 1 ? 's' : ''} · ~{estimateReads(results)} reads</span>
        <span className="flex gap-1">
          <Button variant="ghost" disabled={exportBusy} onClick={() => void exportRecords(results, 'json', 'query-results')}>
            Export JSON
          </Button>
          <Button variant="ghost" disabled={exportBusy} onClick={() => void exportRecords(results, 'csv', 'query-results')}>
            Export CSV
          </Button>
        </span>
      </div>
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          <tr>
            <th className="px-3 py-1.5 font-semibold">id</th>
            {columns.map((col) => (
              <th key={col} className="px-3 py-1.5 font-semibold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((doc) => (
            <ResultRow
              key={doc.path}
              doc={doc}
              columns={columns}
              onSelect={setDocument}
              onOpenRef={(path) => void openRef(path)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Parse user input as a JSON QuerySpec and execute it.
 *
 * @param queryText - Raw JSON string typed by the user.
 * @param setCollection - Setter for the selected collection atom.
 * @param runSpec - Query runner backed by {@link useQueryRunner}.
 * @param setParseError - Setter for the local parse-error message.
 * @returns Resolves once the query has completed or an error is surfaced.
 */
async function executeJsonQuery(
  queryText: string,
  collectionGroup: boolean,
  setCollection: (c: string) => void,
  setLastSpec: (spec: QuerySpec | null) => void,
  runSpec: ReturnType<typeof useQueryRunner>['runSpec'],
  setParseError: (msg: string | null) => void
): Promise<number | null> {
  setParseError(null)
  const parsed = parseJsonObject(queryText)
  if (!parsed.ok) {
    setParseError(parsed.error)
    return null
  }
  try {
    const spec = toQuerySpec(parsed.value)
    if (collectionGroup) spec.collectionGroup = true
    setLastSpec(spec)
    setCollection(spec.collectionPath)
    const docs = await runSpec(spec)
    return docs?.length ?? 0
  } catch (e) {
    setParseError(e instanceof Error ? e.message : 'Invalid query spec')
    return null
  }
}

/**
 * Manual query editor: JSON spec or raw JS, runs the query and displays results.
 *
 * @returns The rendered query editor.
 */
export function QueryEditor(): ReactNode {
  const active = useAtomValue(activeConnectionAtom)
  const readOnly = useReadOnly()
  const setCollection = useSetAtom(selectedCollectionAtom)
  const setResults = useSetAtom(queryResultsAtom)
  const { runSpec, error: jsonError, busy: jsonBusy } = useQueryRunner(active?.id ?? null, queryResultsAtom)
  const { error: jsError, busy: jsBusy, run: runJs } = useAsync()
  const { record } = useQueryHistory()
  const [mode, setMode] = useAtom(queryModeAtom)
  const [queryText, setQueryText] = useAtom(queryDraftAtom)
  const [collectionGroup, setCollectionGroup] = useState(false)
  const [lastSpec, setLastSpec] = useState<QuerySpec | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const busy = mode === 'json' ? jsonBusy : jsBusy
  const apiError = mode === 'json' ? jsonError : jsError

  // Best-effort, non-blocking cost/efficiency hints for the JSON spec being typed.
  const warnings = useMemo(() => {
    if (mode !== 'json' || !queryText.trim()) return []
    const parsed = parseJsonObject(queryText)
    if (!parsed.ok) return []
    try {
      return queryWarnings(toQuerySpec(parsed.value))
    } catch {
      return []
    }
  }, [mode, queryText])

  // JS snippets can write, so they are blocked while read-only.
  const runDisabled = !queryText.trim() || !active || (mode === 'js' && readOnly)

  async function handleRun(): Promise<void> {
    if (mode === 'json') {
      const count = await executeJsonQuery(queryText, collectionGroup, setCollection, setLastSpec, runSpec, setParseError)
      if (count !== null && active) {
        void record({ connectionId: active.id, kind: 'json', query: queryText, resultCount: count })
      }
      return
    }
    setParseError(null)
    if (!active) return setParseError('No active connection')
    const results = await runJs(async () => {
      const r = await unwrap(api.runJsQuery(active.id, queryText))
      setResults(r)
      return r
    })
    void record({ connectionId: active.id, kind: 'js', query: queryText, resultCount: results?.length })
  }

  return (
    <div className="flex h-full flex-col">
      <QueryToolbar
        mode={mode}
        onModeChange={(m) => { setMode(m); setParseError(null) }}
        onRun={() => void handleRun()}
        busy={busy}
        disabled={runDisabled}
      />
      <textarea
        key={mode}
        spellCheck={false}
        className="shrink-0 resize-none border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-slate-300 p-4 font-mono text-xs outline-none"
        rows={8}
        placeholder={mode === 'json' ? JSON_PLACEHOLDER : JS_PLACEHOLDER}
        value={queryText}
        onChange={(e) => setQueryText(e.target.value)}
      />
      {mode === 'json' && (
        <label className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={collectionGroup}
            onChange={(e) => setCollectionGroup(e.target.checked)}
          />
          Collection group query (use the bare collection id, searches all parents)
        </label>
      )}
      {mode === 'js' && readOnly && (
        <WarningList messages={['Read-only mode is on — JS queries are blocked because they can write.']} />
      )}
      <WarningList messages={warnings} />
      <ErrorBanner message={parseError ?? apiError} />
      {mode === 'json' && lastSpec && jsonError && isMissingIndexError(jsonError) && (
        <IndexHint spec={lastSpec} message={jsonError} />
      )}
      <div className="min-h-0 flex-1 overflow-auto">
        <QueryResultsTable />
      </div>
    </div>
  )
}
