import type { DatabaseSchema } from '@shared/types/schema'

/** Chat message exchanged with the Ollama API. */
export interface ChatMessage {
  /** Role of the message author. */
  role: 'system' | 'user'
  /** Message body. */
  content: string
}

/** Instructions describing the exact JSON the model must return. */
const SYSTEM_INSTRUCTIONS = [
  'You are a Firestore query assistant.',
  'Translate the user request into a single JSON object matching this schema:',
  '{"collectionPath": string, "filters": [{"field": string, "operator": string, "value": any}],',
  '"order": {"field": string, "direction": "asc"|"desc"}|null, "limit": number,',
  '"aggregate": "count"|"sum"|"avg"|null, "aggregateField": string|null}.',
  'Use "aggregate":"count" when the user asks how many documents exist (e.g. "how many", "count", "ile").',
  'Use "aggregate":"sum" + "aggregateField":"fieldName" to sum a numeric field (e.g. "total", "suma").',
  'Use "aggregate":"avg" + "aggregateField":"fieldName" to average a numeric field (e.g. "average", "mean", "średnia").',
  'Use only collections and fields from the provided database schema.',
  'For a collection group query (all sub-collections sharing one id, regardless of parent),',
  'set "collectionGroup": true and use the bare collection id as "collectionPath".',
  'Valid operators: ==, !=, <, <=, >, >=, array-contains, in, array-contains-any.',
  'Respond with JSON only, no prose.'
].join(' ')

/**
 * Render a single collection's inferred schema as a compact text line.
 *
 * @param path - Collection path.
 * @param fields - Field descriptors as `name: types` strings.
 * @returns A one-line description of the collection.
 */
function collectionLine(path: string, fields: string[]): string {
  return `- ${path} (${fields.length ? fields.join(', ') : 'no sampled fields'})`
}

/**
 * Render the full database schema as grounding context for the model.
 *
 * @param schema - Inferred database schema.
 * @returns A human/LLM readable schema summary.
 */
export function describeSchema(schema: DatabaseSchema): string {
  const lines = schema.collections.map((col) =>
    collectionLine(
      col.path,
      col.fields.map((field) => `${field.name}: ${field.types.join('|')}`)
    )
  )
  return `Project ${schema.projectId} collections:\n${lines.join('\n')}`
}

/**
 * Build the chat messages sent to Ollama for query generation.
 *
 * @param schema - Inferred database schema used as context.
 * @param instruction - Natural-language request from the user.
 * @returns The ordered system + user messages.
 */
export function buildMessages(schema: DatabaseSchema, instruction: string): ChatMessage[] {
  return [
    { role: 'system', content: `${SYSTEM_INSTRUCTIONS}\n\n${describeSchema(schema)}` },
    { role: 'user', content: instruction }
  ]
}
