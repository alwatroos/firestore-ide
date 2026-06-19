import type { AppSettings } from '@shared/types/settings';
import { DEFAULT_SETTINGS } from '@shared/types/settings';
import { readJson, writeJson } from '../core/jsonFile';
import { settingsFile } from '../core/paths';

/**
 * Load persisted settings, merged over defaults to tolerate added fields.
 *
 * @returns The effective application settings.
 */
export async function loadSettings(): Promise<AppSettings> {
  const stored = await readJson<Partial<AppSettings>>(settingsFile(), {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

/**
 * Persist application settings to disk.
 *
 * @param settings - Settings to persist.
 * @returns The persisted settings.
 */
export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  await writeJson(settingsFile(), settings);
  return settings;
}
