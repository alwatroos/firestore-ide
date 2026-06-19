import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Read and parse a JSON file, returning a fallback when it does not yet exist.
 *
 * @template T - Expected shape of the parsed document.
 * @param filePath - Absolute path to the JSON file.
 * @param fallback - Value returned when the file is missing.
 * @returns The parsed contents, or `fallback` if the file is absent.
 */
export async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw error;
  }
}

/**
 * Serialise a value to a JSON file, creating parent directories as needed.
 *
 * @template T - Type of the value being persisted.
 * @param filePath - Absolute destination path.
 * @param value - Value to serialise.
 * @returns Resolves once the file has been written.
 */
export async function writeJson<T>(filePath: string, value: T): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
}
