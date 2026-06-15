import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc/channels'
import type { FirestoreIdeApi } from '@shared/types/api'

/**
 * The renderer-facing API. Every method is a thin `ipcRenderer.invoke` wrapper;
 * no Node, Electron or credential objects are ever exposed to the renderer.
 */
const api: FirestoreIdeApi = {
  listConnections: () => ipcRenderer.invoke(IPC.connectionsList),
  addConnection: (input) => ipcRenderer.invoke(IPC.connectionsAdd, input),
  removeConnection: (id) => ipcRenderer.invoke(IPC.connectionsRemove, id),
  testConnection: (id) => ipcRenderer.invoke(IPC.connectionsTest, id),
  listCollections: (id, parentPath) =>
    ipcRenderer.invoke(IPC.firestoreListCollections, id, parentPath),
  listDocuments: (id, path, limit) =>
    ipcRenderer.invoke(IPC.firestoreListDocuments, id, path, limit),
  runQuery: (id, spec) => ipcRenderer.invoke(IPC.firestoreRunQuery, id, spec),
  saveDocument: (id, doc) => ipcRenderer.invoke(IPC.firestoreSaveDocument, id, doc),
  deleteDocument: (id, path) => ipcRenderer.invoke(IPC.firestoreDeleteDocument, id, path),
  getSchema: (id) => ipcRenderer.invoke(IPC.firestoreGetSchema, id),
  listModels: (host) => ipcRenderer.invoke(IPC.ollamaListModels, host),
  generateQuery: (input) => ipcRenderer.invoke(IPC.ollamaGenerateQuery, input),
  getSettings: () => ipcRenderer.invoke(IPC.settingsGet),
  saveSettings: (settings) => ipcRenderer.invoke(IPC.settingsSave, settings)
}

contextBridge.exposeInMainWorld('api', api)
