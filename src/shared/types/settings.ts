/** User-configurable application settings. */
export interface AppSettings {
  /** Base URL of the Ollama host (e.g. `http://localhost:11434`). */
  ollamaHost: string
  /** Last-used model name, if any. */
  defaultModel: string | null
  /** Number of documents sampled per collection when inferring schema. */
  schemaSampleSize: number
}

/** Default settings applied on first launch. */
export const DEFAULT_SETTINGS: AppSettings = {
  ollamaHost: 'http://localhost:11434',
  defaultModel: null,
  schemaSampleSize: 25
}
