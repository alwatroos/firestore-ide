import type { GeneratedQuery, GenerateQueryInput } from '@shared/types/ollama'
import { inferSchema } from '../firestore/schema'
import { loadSettings } from '../settings/store'
import { chatJson, chatJsonStream } from './client'
import { buildMessages } from './prompt'

/**
 * Generate a Firestore query from a natural-language instruction, grounded in
 * the connection's inferred schema and the configured Ollama host.
 *
 * @param input - Connection, model and instruction for generation.
 * @returns The raw generated query JSON and the model used.
 */
export async function generateQuery(input: GenerateQueryInput): Promise<GeneratedQuery> {
  const settings = await loadSettings()
  const schema = await inferSchema(input.connectionId, settings.schemaSampleSize)
  const raw = await chatJson(settings.ollamaHost, input.model, buildMessages(schema, input.instruction))
  return { raw, model: input.model }
}

/**
 * Stream query generation token-by-token, calling `onChunk` for each delta.
 *
 * @param input - Connection, model and instruction for generation.
 * @param onChunk - Called with each incremental text token.
 * @returns The complete generated query JSON and the model used.
 */
export async function generateQueryStream(
  input: GenerateQueryInput,
  onChunk: (text: string) => void
): Promise<GeneratedQuery> {
  const settings = await loadSettings()
  const schema = await inferSchema(input.connectionId, settings.schemaSampleSize)
  const raw = await chatJsonStream(
    settings.ollamaHost,
    input.model,
    buildMessages(schema, input.instruction),
    onChunk
  )
  return { raw, model: input.model }
}
