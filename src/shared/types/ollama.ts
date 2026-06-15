/** A model advertised by an Ollama host. */
export interface OllamaModel {
  /** Model name/tag, e.g. `llama3.1:8b`. */
  name: string
  /** Approximate on-disk size in bytes, when reported. */
  size?: number
}

/** Request to generate a Firestore query from a natural-language instruction. */
export interface GenerateQueryInput {
  /** Connection whose schema provides grounding context. */
  connectionId: string
  /** Ollama model to use. */
  model: string
  /** Natural-language description of the desired query. */
  instruction: string
}

/** Result of an AI query-generation request. */
export interface GeneratedQuery {
  /** Generated, ready-to-run query specification (JSON string). */
  raw: string
  /** Model that produced the answer. */
  model: string
}
