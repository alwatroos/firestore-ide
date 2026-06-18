import type { DocumentRecord } from '@shared/types/firestore'

/** Available sub-tabs in the explorer pane. */
export type ExplorerTab = 'browse' | 'query' | 'history'

/** All state belonging to a single query tab. */
export interface QueryTab {
  id: string
  label: string
  selectedCollection: string | null
  activeSubTab: ExplorerTab
  queryMode: 'json' | 'js'
  queryDraft: string
  queryResults: DocumentRecord[]
  selectedDocument: DocumentRecord | null
  aiInstruction: string
  aiStreamText: string
  aiDraft: string
  aiBusy: boolean
  aiError: string | null
}

let _counter = 0

/**
 * Create a new query tab with default state and a unique id.
 *
 * @returns A fresh {@link QueryTab}.
 */
export function createTab(): QueryTab {
  _counter++
  return {
    id: `tab-${_counter}`,
    label: `Query ${_counter}`,
    selectedCollection: null,
    activeSubTab: 'browse',
    queryMode: 'json',
    queryDraft: '',
    queryResults: [],
    selectedDocument: null,
    aiInstruction: '',
    aiStreamText: '',
    aiDraft: '',
    aiBusy: false,
    aiError: null,
  }
}
