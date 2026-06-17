/** How an import/restore handles a document whose id already exists. */
export type ImportMode = 'overwrite' | 'merge'

/** A document to import into a collection; a missing id gets an auto-generated one. */
export interface ImportDoc {
  /** Optional document id; omitted means auto-id. */
  id?: string
  /** Document fields (plain JSON, may contain type markers). */
  data: Record<string, unknown>
}

/** A document within a backup, including its sub-collections (recursive). */
export interface BackupDocument {
  /** Document id. */
  id: string
  /** Document fields (plain JSON with type markers). */
  data: Record<string, unknown>
  /** Sub-collections nested under this document. */
  subcollections: CollectionBackup[]
}

/** A recursive backup of a collection and everything beneath it. */
export interface CollectionBackup {
  /** Full collection path. */
  path: string
  /** Documents in the collection. */
  documents: BackupDocument[]
}

/** Summary of how many documents an import or restore wrote. */
export interface TransferResult {
  /** Number of documents written. */
  written: number
}
