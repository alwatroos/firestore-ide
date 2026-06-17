/**
 * Public, secret-free description of a Firestore connection. This is the only
 * connection shape ever sent to the renderer process.
 */
export interface ConnectionMeta {
  /** Stable unique identifier of the connection. */
  id: string
  /** Human-friendly display name. */
  name: string
  /** Google Cloud / Firebase project id. */
  projectId: string
  /** Service account client email (safe to display, identifies the actor). */
  clientEmail: string
  /** ISO timestamp of creation. */
  createdAt: string
  /** When true, all write operations against this connection are blocked. */
  readOnly?: boolean
}

/**
 * Mutable, secret-free fields of a connection that the renderer may update.
 * Deliberately excludes credentials so secrets can never be injected via patch.
 */
export interface ConnectionPatch {
  /** New display name. */
  name?: string
  /** New per-connection read-only flag. */
  readOnly?: boolean
}

/**
 * Input supplied by the user when registering a new connection. The
 * `serviceAccountJson` is consumed in the main process and never persisted in
 * plaintext nor echoed back to the renderer.
 */
export interface NewConnectionInput {
  /** Human-friendly display name. */
  name: string
  /** Raw service account key file contents (JSON string). */
  serviceAccountJson: string
}

/**
 * Persisted connection record kept exclusively in the main process. The
 * `encryptedCredentials` field holds an OS-encrypted service account key.
 */
export interface StoredConnection extends ConnectionMeta {
  /** Base64 of the `safeStorage`-encrypted service account JSON. */
  encryptedCredentials: string
}
