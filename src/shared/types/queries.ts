/** The form a recorded query took. */
export type QueryKind = 'json' | 'js' | 'ai';

/** A single entry in the query history. */
export interface QueryHistoryEntry {
  /** Stable unique id. */
  id: string;
  /** Connection the query ran against. */
  connectionId: string;
  /** Whether the query was a JSON spec, JS snippet or AI-generated spec. */
  kind: QueryKind;
  /** The JSON spec (json/ai) or JS code (js) that was executed. */
  query: string;
  /** Natural-language instruction, for AI-generated queries. */
  instruction?: string;
  /** ISO timestamp of execution. */
  createdAt: string;
  /** Number of results the run returned, if known. */
  resultCount?: number;
}

/** A user-named, persisted query. */
export interface SavedQuery {
  /** Stable unique id. */
  id: string;
  /** User-given name. */
  name: string;
  /** Connection the query is associated with. */
  connectionId: string;
  /** Whether the query is a JSON spec, JS snippet or AI-generated spec. */
  kind: QueryKind;
  /** The JSON spec or JS code. */
  query: string;
  /** ISO timestamp of creation. */
  createdAt: string;
}

/** Payload for recording a query into history. */
export interface RecordQueryInput {
  connectionId: string;
  kind: QueryKind;
  query: string;
  instruction?: string;
  resultCount?: number;
}

/** Payload for saving a named query. */
export interface SaveQueryInput {
  name: string;
  connectionId: string;
  kind: QueryKind;
  query: string;
}
