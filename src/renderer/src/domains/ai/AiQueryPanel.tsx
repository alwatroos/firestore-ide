import { useAtomValue, useSetAtom } from 'jotai'
import { useState, type ReactNode } from 'react'
import { Button, ErrorBanner } from '../../components/ui'
import { activeConnectionAtom } from '../connections/atoms'
import { selectedCollectionAtom } from '../explorer/atoms'
import { useQueryRunner } from '../explorer/hooks'
import { useSettings } from '../settings/hooks'
import { useGenerate, useModels } from './hooks'
import { parseQuerySpec } from './parse'

/**
 * Natural-language query assistant: generates a query via Ollama, grounded in
 * the connected database's schema, then runs it against Firestore.
 *
 * @returns The rendered assistant panel.
 */
export function AiQueryPanel(): ReactNode {
  const active = useAtomValue(activeConnectionAtom)
  const { settings } = useSettings()
  const { models, selected, setSelected, error: modelError } = useModels(settings.ollamaHost)
  const [instruction, setInstruction] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const { generate, error, busy } = useGenerate()
  const { runSpec } = useQueryRunner(active?.id ?? null)
  const setCollection = useSetAtom(selectedCollectionAtom)

  /**
   * Parse a generated query and execute it, surfacing parse failures.
   *
   * @param raw - Raw JSON returned by the model.
   * @returns Resolves once the query has run or an error is shown.
   */
  async function applySpec(raw: string): Promise<void> {
    try {
      const spec = parseQuerySpec(raw)
      setCollection(spec.collectionPath)
      await runSpec(spec)
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'Failed to parse query')
    }
  }

  /**
   * Generate a query from the current instruction and run it.
   *
   * @returns Resolves once generation and execution complete.
   */
  async function onGenerate(): Promise<void> {
    setLocalError(null)
    if (!active) return setLocalError('Select a connection first')
    const result = await generate({ connectionId: active.id, model: selected, instruction })
    if (result) await applySpec(result.raw)
  }

  return (
    <div className="space-y-2 border-t border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">AI query</span>
        <select
          className="rounded border border-slate-300 px-2 py-1 text-xs"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {models.length === 0 && <option value="">No models</option>}
          {models.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        rows={2}
        placeholder="Describe the data you want, e.g. 'active users created this month'"
        className="w-full resize-none rounded border border-slate-300 px-2 py-1 text-sm"
        value={instruction}
        onChange={(event) => setInstruction(event.target.value)}
      />
      <div className="flex items-center justify-end">
        <Button onClick={() => void onGenerate()} disabled={busy || !selected || !instruction.trim()}>
          {busy ? 'Generating…' : 'Generate & run'}
        </Button>
      </div>
      <ErrorBanner message={localError ?? error ?? modelError} />
    </div>
  )
}
