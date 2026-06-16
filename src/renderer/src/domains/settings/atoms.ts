import { atom } from 'jotai'
import type { AppSettings } from '@shared/types/settings'
import { DEFAULT_SETTINGS } from '@shared/types/settings'

/** Current application settings. */
export const settingsAtom = atom<AppSettings>(DEFAULT_SETTINGS)
