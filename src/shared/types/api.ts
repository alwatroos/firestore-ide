import type { ConnectionMeta, ConnectionPatch, NewConnectionInput } from './connection';
import type { FileFilter, OpenFileResult, SaveFileResult } from './files';
import type { DocumentRecord, QuerySpec } from './firestore';
import type { GeneratedQuery, GenerateQueryInput, OllamaModel } from './ollama';
import type { QueryHistoryEntry, RecordQueryInput, SavedQuery, SaveQueryInput } from './queries';
import type { Result } from './result';
import type { SecurityRules } from './rules';
import type { DatabaseSchema } from './schema';
import type { AppSettings } from './settings';
import type { CollectionBackup, ImportDoc, ImportMode, TransferResult } from './transfer';

/**
 * The complete, type-safe surface exposed to the renderer via `window.api`.
 * Every method resolves to a {@link Result} so errors are sanitised strings
 * rather than raw exceptions crossing the process boundary.
 */
export interface FirestoreIdeApi {
  /** List all stored connections (without secrets). */
  listConnections: () => Promise<Result<ConnectionMeta[]>>;
  /** Register a new connection from a service account key. */
  addConnection: (input: NewConnectionInput) => Promise<Result<ConnectionMeta>>;
  /** Apply a secret-free patch (name, read-only flag) to a connection. */
  updateConnection: (id: string, patch: ConnectionPatch) => Promise<Result<ConnectionMeta>>;
  /** Remove a connection and dispose its Firestore client. */
  removeConnection: (id: string) => Promise<Result<void>>;
  /** Verify a connection can reach Firestore. */
  testConnection: (id: string) => Promise<Result<boolean>>;
  /** List collection ids for a connection (optionally under a document). */
  listCollections: (connectionId: string, parentPath?: string) => Promise<Result<string[]>>;
  /** List documents within a collection. */
  listDocuments: (
    connectionId: string,
    collectionPath: string,
    limit?: number,
    offset?: number
  ) => Promise<Result<DocumentRecord[]>>;
  /** Fetch a single document by path (used to follow references). */
  getDocument: (connectionId: string, path: string) => Promise<Result<DocumentRecord | null>>;
  /** Run a declarative query. */
  runQuery: (connectionId: string, spec: QuerySpec) => Promise<Result<DocumentRecord[]>>;
  /** Create or fully overwrite a document. */
  saveDocument: (connectionId: string, doc: DocumentRecord) => Promise<Result<DocumentRecord>>;
  /** Delete a document by path. */
  deleteDocument: (connectionId: string, path: string) => Promise<Result<void>>;
  /** Import documents into a collection (batched), overwriting or merging. */
  importDocuments: (
    connectionId: string,
    collectionPath: string,
    docs: ImportDoc[],
    mode: ImportMode
  ) => Promise<Result<TransferResult>>;
  /** Recursively read a collection and its sub-collections into a backup. */
  readCollection: (
    connectionId: string,
    collectionPath: string
  ) => Promise<Result<CollectionBackup>>;
  /** Recursively restore a collection backup to its original paths. */
  restoreCollection: (
    connectionId: string,
    backup: CollectionBackup,
    mode: ImportMode
  ) => Promise<Result<TransferResult>>;
  /** Infer and return an AI-ready schema snapshot. */
  getSchema: (connectionId: string) => Promise<Result<DatabaseSchema>>;
  /** List models available on an Ollama host. */
  listModels: (host: string) => Promise<Result<OllamaModel[]>>;
  /** Execute a user-provided JS snippet against Firestore (main-process sandbox). */
  runJsQuery: (connectionId: string, code: string) => Promise<Result<DocumentRecord[]>>;
  /** Generate a query from natural language grounded in the DB schema. */
  generateQuery: (input: GenerateQueryInput) => Promise<Result<GeneratedQuery>>;
  /**
   * Stream a query generation token-by-token.
   * Returns a cleanup function that removes all IPC listeners.
   */
  generateQueryStream: (
    input: GenerateQueryInput,
    onChunk: (text: string) => void,
    onDone: (result: GeneratedQuery) => void,
    onError: (error: string) => void
  ) => () => void;
  /** Save text to a user-chosen file via a native dialog. */
  saveFile: (
    suggestedName: string,
    content: string,
    filters?: FileFilter[]
  ) => Promise<Result<SaveFileResult>>;
  /** Open and read a user-chosen file via a native dialog. */
  openFile: (filters?: FileFilter[]) => Promise<Result<OpenFileResult>>;
  /** List recorded query history, most recent first. */
  listQueryHistory: () => Promise<Result<QueryHistoryEntry[]>>;
  /** Record a query execution into history. */
  recordQuery: (input: RecordQueryInput) => Promise<Result<QueryHistoryEntry>>;
  /** List user-named saved queries. */
  listSavedQueries: () => Promise<Result<SavedQuery[]>>;
  /** Save a named query. */
  saveQuery: (input: SaveQueryInput) => Promise<Result<SavedQuery>>;
  /** Delete a saved query by id. */
  deleteSavedQuery: (id: string) => Promise<Result<void>>;
  /** Fetch the active Firestore Security Rules for a connection's project. */
  getActiveRules: (connectionId: string) => Promise<Result<SecurityRules>>;
  /** Read persisted application settings. */
  getSettings: () => Promise<Result<AppSettings>>;
  /** Persist application settings. */
  saveSettings: (settings: AppSettings) => Promise<Result<AppSettings>>;
}
