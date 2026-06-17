import type { OllamaModel } from '@shared/types/ollama'
import { atom } from 'jotai'

/** Models advertised by the configured Ollama host. */
export const modelsAtom = atom<OllamaModel[]>([])

/** Currently selected model name. */
export const selectedModelAtom = atom<string>('')
