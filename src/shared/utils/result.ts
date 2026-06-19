import type { Result } from '../types/result';

/**
 * Build a successful {@link Result}.
 *
 * @template T - Payload type.
 * @param data - The success payload.
 * @returns A successful result wrapping `data`.
 */
export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

/**
 * Build a failed {@link Result} from a sanitised message.
 *
 * @param error - Human-readable, secret-free error message.
 * @returns A failed result.
 */
export function err(error: string): Result<never> {
  return { ok: false, error };
}

/**
 * Convert an unknown thrown value into a safe message, never exposing stack
 * traces or non-string internals to the renderer.
 *
 * @param error - The caught value.
 * @returns A concise, displayable error message.
 */
export function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : 'Unexpected error';
}
