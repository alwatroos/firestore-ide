/**
 * Centralised registry of IPC channel names shared between the main and
 * renderer processes. Using constants avoids typo-driven channel mismatches.
 */
export const IPC = {
  connectionsList: 'connections:list',
  connectionsAdd: 'connections:add',
  connectionsRemove: 'connections:remove',
  connectionsTest: 'connections:test',
  firestoreListCollections: 'firestore:listCollections',
  firestoreListDocuments: 'firestore:listDocuments',
  firestoreRunQuery: 'firestore:runQuery',
  firestoreRunJsQuery: 'firestore:runJsQuery',
  firestoreSaveDocument: 'firestore:saveDocument',
  firestoreDeleteDocument: 'firestore:deleteDocument',
  firestoreGetSchema: 'firestore:getSchema',
  ollamaListModels: 'ollama:listModels',
  ollamaGenerateQuery: 'ollama:generateQuery',
  ollamaGenerateQueryStream: 'ollama:generateQueryStream',
  ollamaStreamChunk: 'ollama:streamChunk',
  ollamaStreamDone: 'ollama:streamDone',
  ollamaStreamError: 'ollama:streamError',
  settingsGet: 'settings:get',
  settingsSave: 'settings:save'
} as const

/** Union of all valid IPC channel names. */
export type IpcChannel = (typeof IPC)[keyof typeof IPC]
