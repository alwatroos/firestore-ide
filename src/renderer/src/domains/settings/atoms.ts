import type { AppSettings } from '@shared/types/settings'
import { DEFAULT_SETTINGS } from '@shared/types/settings'
import { atom } from 'jotai'

/** Current application settings. */
export const settingsAtom = atom<AppSettings>(DEFAULT_SETTINGS)
