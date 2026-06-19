import type { ConnectionMeta, StoredConnection } from '@shared/types/connection';

/** Minimal shape of a Google service account key file. */
export interface ServiceAccount {
  /** Firebase / GCP project id. */
  project_id: string;
  /** Service account email. */
  client_email: string;
  /** PEM private key. */
  private_key: string;
}

/**
 * Strip secrets from a stored connection, yielding the renderer-safe metadata.
 *
 * @param stored - Persisted connection including encrypted credentials.
 * @returns Secret-free connection metadata.
 */
export function toMeta(stored: StoredConnection): ConnectionMeta {
  const { encryptedCredentials: _omitted, ...meta } = stored;
  return meta;
}

/**
 * Parse and validate raw service account JSON.
 *
 * @param json - Raw service account key file contents.
 * @returns The validated service account object.
 * @throws If required fields are missing or the JSON is malformed.
 */
export function parseServiceAccount(json: string): ServiceAccount {
  const parsed = JSON.parse(json) as Partial<ServiceAccount>;
  if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
    throw new Error('Invalid service account: missing project_id, client_email or private_key');
  }
  return parsed as ServiceAccount;
}
