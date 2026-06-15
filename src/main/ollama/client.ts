import { Ollama } from 'ollama'
import type { OllamaModel } from '@shared/types/ollama'
import type { ChatMessage } from './prompt'

/**
 * List the models available on an Ollama host.
 *
 * @param host - Base URL of the Ollama host.
 * @returns The advertised models with optional sizes.
 */
export async function listModels(host: string): Promise<OllamaModel[]> {
  const client = new Ollama({ host })
  const res = await client.list()
  return res.models.map((model) => ({ name: model.name, size: model.size }))
}

/**
 * Send a chat completion request constrained to JSON output.
 *
 * @param host - Base URL of the Ollama host.
 * @param model - Model name to invoke.
 * @param messages - Ordered chat messages.
 * @returns The raw JSON content returned by the model.
 */
export async function chatJson(
  host: string,
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const client = new Ollama({ host })
  const res = await client.chat({ model, messages, format: 'json', stream: false })
  return res.message.content
}
