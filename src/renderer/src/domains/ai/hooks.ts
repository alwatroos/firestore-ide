import type { GeneratedQuery, GenerateQueryInput } from '@shared/types/ollama'
import { useAtom } from 'jotai'
import { useCallback, useEffect } from 'react'
import { api, unwrap } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { modelsAtom, selectedModelAtom } from './atoms'

/**
 * Load the model list from a host and default the selection.
 *
 * @param host - Ollama host base URL.
 * @returns Models, selection state and busy/error flags.
 */
export function useModels(host: string) {
  const [models, setModels] = useAtom(modelsAtom)
  const [selected, setSelected] = useAtom(selectedModelAtom)
  const { error, busy, run } = useAsync()
  const refresh = useCallback(
    () => run(async () => setModels(await unwrap(api.listModels(host)))),
    [host, run, setModels]
  )
  useEffect(() => void refresh(), [refresh])
  useEffect(() => {
    if (!selected && models[0]) setSelected(models[0].name)
  }, [models, selected, setSelected])
  return { models, selected, setSelected, error, busy }
}

/**
 * Provide a query-generation action backed by the Ollama service.
 *
 * @returns A `generate` action plus busy/error state.
 */
export function useGenerate() {
  const { error, busy, run } = useAsync()
  const generate = useCallback(
    (input: GenerateQueryInput): Promise<GeneratedQuery | undefined> =>
      run(() => unwrap(api.generateQuery(input))),
    [run]
  )
  return { generate, error, busy }
}

/**
 * Streaming variant: calls `onChunk` for each token then resolves with the full result.
 *
 * @returns A `generate` action that streams tokens, plus busy/error state.
 */
export function useGenerateStream() {
  const { error, busy, run } = useAsync()
  const generate = useCallback(
    (
      input: GenerateQueryInput,
      onChunk: (text: string) => void
    ): Promise<GeneratedQuery | undefined> =>
      run(
        () =>
          new Promise<GeneratedQuery>((resolve, reject) => {
            const cleanup = api.generateQueryStream(
              input,
              onChunk,
              (result) => {
                cleanup()
                resolve(result)
              },
              (errMsg) => {
                cleanup()
                reject(new Error(errMsg))
              }
            )
          })
      ),
    [run]
  )
  return { generate, error, busy }
}
