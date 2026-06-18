import { useAtom, useAtomValue, useSetAtom, useStore } from 'jotai'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Button, ErrorBanner, WarningList } from '../../components/ui'
import { api } from '../../lib/api'
import { activeConnectionAtom } from '../connections/atoms'
import {
  activeQueryTabIdAtom,
  activeTabAtom,
  aiBusyAtom,
  aiDraftAtom,
  aiErrorAtom,
  aiInstructionAtom,
  aiStreamTextAtom,
  queryResultsAtom,
  queryTabsAtom,
  selectedCollectionAtom,
} from '../explorer/atoms'
import { useQueryRunner } from '../explorer/hooks'
import { queryWarnings } from '../explorer/queryWarnings'
import { useQueryHistory } from '../queries/hooks'
import { useSettings } from '../settings/hooks'
import { useModels } from './hooks'
import { parseQuerySpec } from './parse'

/** Props for {@link AiQueryPanel}. */
interface AiQueryPanelProps {
  /** Opens the settings dialog so the user can configure the Ollama host. */
  onOpenSettings: () => void
}

/**
 * Amber hint shown when no Ollama models are reachable.
 *
 * @param props - Settings opener callback.
 * @returns The rendered hint banner.
 */
function OllamaUnavailableHint({ onOpenSettings }: { onOpenSettings: () => void }): ReactNode {
  return (
    <div className="rounded bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      No Ollama models found. Make sure Ollama is running at the configured host.{' '}
      <button
        type="button"
        className="underline hover:text-amber-900 dark:hover:text-amber-200"
        onClick={onOpenSettings}
      >
        Open Settings
      </button>
    </div>
  )
}

/**
 * Live streaming log that auto-scrolls as new tokens arrive.
 *
 * @param props - Accumulated text and busy flag.
 * @returns The rendered terminal-style log, or `null` when empty.
 */
function StreamingLog({ text, busy }: { text: string; busy: boolean }): ReactNode {
  const ref = useRef<HTMLPreElement>(null)
  // No dep array — runs after every render; scrolls on each new token.
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  })
  if (!text && !busy) return null
  return (
    <div className="rounded border border-slate-700 bg-slate-900">
      <div className="flex items-center gap-1.5 border-b border-slate-700 px-3 py-1">
        {busy && (
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
        )}
        <span className="text-xs text-slate-400">{busy ? 'Generating…' : 'Done'}</span>
      </div>
      <pre
        ref={ref}
        className="max-h-28 overflow-auto p-3 font-mono text-xs leading-relaxed text-green-400 whitespace-pre-wrap"
      >
        {text || '…'}
      </pre>
    </div>
  )
}

/**
 * Pretty-print raw model JSON; falls back to the raw text when it is not valid JSON.
 *
 * @param raw - Raw JSON string from the model.
 * @returns A formatted string suitable for editing.
 */
function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

/**
 * Parse a generated query spec, run it and store results in the Query tab atom.
 *
 * @param raw - Raw JSON returned by the model.
 * @param setCollection - Setter for the selected collection atom.
 * @param setTab - Setter to switch to the Query tab.
 * @param runSpec - Query runner targeting {@link queryResultsAtom}.
 * @param setLocalError - Setter for a local error message.
 * @returns Resolves once the query has run or an error is surfaced.
 */
async function applySpec(
  raw: string,
  setCollection: (c: string) => void,
  setTab: (t: 'query') => void,
  runSpec: (spec: ReturnType<typeof parseQuerySpec>) => Promise<unknown>,
  setLocalError: (msg: string | null) => void
): Promise<void> {
  try {
    const spec = parseQuerySpec(raw)
    setCollection(spec.collectionPath)
    await runSpec(spec)
    setTab('query')
  } catch (caught) {
    setLocalError(caught instanceof Error ? caught.message : 'Failed to parse generated query')
  }
}

/**
 * Patch a specific tab's AI state directly in the store.
 * Used inside generation callbacks so updates target the tab that triggered them,
 * not the tab that happens to be active when the callback fires (enables concurrency).
 */
function patchTab(
  store: ReturnType<typeof useStore>,
  tabId: string,
  patch: Partial<{
    aiStreamText: string
    aiDraft: string
    aiBusy: boolean
    aiError: string | null
  }>
) {
  store.set(queryTabsAtom, (tabs) => tabs.map((t) => (t.id === tabId ? { ...t, ...patch } : t)))
}

/**
 * Append a streaming chunk to a specific tab's AI log.
 * Separate from patchTab to allow incremental appends without a full patch object.
 */
function appendChunk(store: ReturnType<typeof useStore>, tabId: string, chunk: string) {
  store.set(queryTabsAtom, (tabs) =>
    tabs.map((t) => (t.id === tabId ? { ...t, aiStreamText: t.aiStreamText + chunk } : t))
  )
}

/**
 * Natural-language query assistant: streams a Firestore query via Ollama,
 * showing the generation token-by-token, then executes it and shows results.
 * Each query tab has independent AI state; multiple tabs can generate concurrently.
 *
 * @param props - Settings opener callback.
 * @returns The rendered assistant panel.
 */
export function AiQueryPanel({ onOpenSettings }: AiQueryPanelProps): ReactNode {
  const store = useStore()
  const active = useAtomValue(activeConnectionAtom)
  const activeTabId = useAtomValue(activeQueryTabIdAtom)
  const { settings } = useSettings()
  const { models, selected, setSelected, error: modelError } = useModels(settings.ollamaHost)

  // Per-tab AI state
  const [instruction, setInstruction] = useAtom(aiInstructionAtom)
  const streamText = useAtomValue(aiStreamTextAtom)
  const [draft, setDraft] = useAtom(aiDraftAtom)
  const busy = useAtomValue(aiBusyAtom)
  const aiError = useAtomValue(aiErrorAtom)

  // Transient UI state (local — resets on tab switch intentionally)
  const [localError, setLocalError] = useState<string | null>(null)

  const { runSpec, busy: runBusy } = useQueryRunner(active?.id ?? null, queryResultsAtom)
  const { record } = useQueryHistory()
  const setCollection = useSetAtom(selectedCollectionAtom)
  const setTab = useSetAtom(activeTabAtom)

  /**
   * Stream a query for the current instruction.
   * The tab id is captured at call time so the streaming callbacks update the
   * correct tab even if the user switches away mid-generation.
   *
   * @returns Resolves once generation completes or fails.
   */
  async function onGenerate(): Promise<void> {
    setLocalError(null)
    if (!active) return setLocalError('Select a connection first')

    const tabId = activeTabId
    patchTab(store, tabId, { aiStreamText: '', aiDraft: '', aiBusy: true, aiError: null })

    try {
      const result = await new Promise<{ raw: string }>((resolve, reject) => {
        const cleanup = api.generateQueryStream(
          { connectionId: active.id, model: selected, instruction },
          (chunk) => appendChunk(store, tabId, chunk),
          (res) => {
            cleanup()
            resolve(res)
          },
          (errMsg) => {
            cleanup()
            reject(new Error(errMsg))
          }
        )
      })
      patchTab(store, tabId, { aiBusy: false, aiDraft: prettyJson(result.raw) })
    } catch (err) {
      patchTab(store, tabId, {
        aiBusy: false,
        aiError: err instanceof Error ? err.message : 'Generation failed',
      })
    }
  }

  /**
   * Run the reviewed (possibly hand-edited) draft query and switch to the Query tab.
   *
   * @returns Resolves once the query has run or an error is surfaced.
   */
  async function onRun(): Promise<void> {
    setLocalError(null)
    await applySpec(draft, setCollection, setTab, runSpec, setLocalError)
    if (active) void record({ connectionId: active.id, kind: 'ai', query: draft, instruction })
  }

  // Advisory warnings for the draft query, recomputed as the user edits it.
  const warnings = useMemo(() => {
    if (!draft.trim()) return []
    try {
      return queryWarnings(parseQuerySpec(draft))
    } catch {
      return []
    }
  }, [draft])

  const noModels = models.length === 0
  const canGenerate = !busy && !noModels && !!selected && !!instruction.trim()

  return (
    <div className="shrink-0 space-y-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">AI query</span>
        <select
          className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-300 px-2 py-1 text-xs disabled:opacity-50"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={noModels}
        >
          {noModels && <option value="">No models available</option>}
          {models.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {noModels ? (
        <OllamaUnavailableHint onOpenSettings={onOpenSettings} />
      ) : (
        <>
          <textarea
            rows={2}
            placeholder="Describe the data you want, e.g. 'how many users are active'"
            className="w-full resize-none rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500 px-2 py-1 text-sm"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (canGenerate) void onGenerate()
              }
            }}
          />
          <div className="flex items-center justify-end">
            <Button onClick={() => void onGenerate()} disabled={!canGenerate}>
              {busy ? 'Generating…' : 'Generate'}
            </Button>
          </div>
          <StreamingLog text={streamText} busy={busy} />
        </>
      )}

      {draft && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
            Review query before running
          </label>
          <textarea
            spellCheck={false}
            rows={6}
            className="w-full resize-none rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 dark:text-slate-300 p-2 font-mono text-xs outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <WarningList messages={warnings} />
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setDraft('')}>
              Discard
            </Button>
            <Button onClick={() => void onRun()} disabled={runBusy || !draft.trim()}>
              {runBusy ? 'Running…' : 'Run query'}
            </Button>
          </div>
        </div>
      )}

      <ErrorBanner message={localError ?? aiError ?? (noModels ? null : modelError)} />
    </div>
  )
}
