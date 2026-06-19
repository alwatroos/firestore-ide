import { join } from 'node:path';
import { app } from 'electron';

/**
 * Absolute path to the connections store file inside the OS user-data dir.
 *
 * @returns Path to `connections.json`.
 */
export function connectionsFile(): string {
  return join(app.getPath('userData'), 'connections.json');
}

/**
 * Absolute path to the settings store file inside the OS user-data dir.
 *
 * @returns Path to `settings.json`.
 */
export function settingsFile(): string {
  return join(app.getPath('userData'), 'settings.json');
}

/**
 * Absolute path to the query history / saved queries store file.
 *
 * @returns Path to `queries.json`.
 */
export function queriesFile(): string {
  return join(app.getPath('userData'), 'queries.json');
}
