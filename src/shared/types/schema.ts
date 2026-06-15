/** Inferred type information for a single document field. */
export interface FieldSchema {
  /** Field name. */
  name: string
  /** Distinct value types observed across sampled documents. */
  types: string[]
  /** Number of sampled documents in which the field appeared. */
  occurrences: number
}

/** Inferred schema of a single collection, built from a document sample. */
export interface CollectionSchema {
  /** Collection path. */
  path: string
  /** Number of documents sampled to build this schema. */
  sampleSize: number
  /** Inferred fields. */
  fields: FieldSchema[]
}

/** Aggregate, AI-ready schema snapshot of a connection's database. */
export interface DatabaseSchema {
  /** Project the schema was sampled from. */
  projectId: string
  /** Per-collection inferred schemas. */
  collections: CollectionSchema[]
}
