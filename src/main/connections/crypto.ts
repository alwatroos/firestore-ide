import { safeStorage } from 'electron';

/**
 * Encrypt a plaintext secret using the OS keychain-backed `safeStorage`.
 *
 * @param plaintext - Sensitive string (e.g. a service account key).
 * @returns Base64 ciphertext suitable for at-rest storage.
 * @throws If OS-level encryption is unavailable.
 */
export function encryptSecret(plaintext: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure storage is unavailable on this system');
  }
  return safeStorage.encryptString(plaintext).toString('base64');
}

/**
 * Decrypt a base64 ciphertext previously produced by {@link encryptSecret}.
 *
 * @param ciphertext - Base64 ciphertext.
 * @returns The recovered plaintext secret.
 */
export function decryptSecret(ciphertext: string): string {
  return safeStorage.decryptString(Buffer.from(ciphertext, 'base64'));
}
