import { IPC, streamChannels } from '@shared/ipc/channels';
import type { FirestoreIdeApi } from '@shared/types/api';
import type { GeneratedQuery } from '@shared/types/ollama';
import { contextBridge, type IpcRendererEvent, ipcRenderer } from 'electron';

/**
 * The renderer-facing API. Every method is a thin `ipcRenderer.invoke` wrapper;
 * no Node, Electron or credential objects are ever exposed to the renderer.
 */
const api: FirestoreIdeApi = {
  listConnections: () => ipcRenderer.invoke(IPC.connectionsList),
  addConnection: (input) => ipcRenderer.invoke(IPC.connectionsAdd, input),
  updateConnection: (id, patch) => ipcRenderer.invoke(IPC.connectionsUpdate, id, patch),
  removeConnection: (id) => ipcRenderer.invoke(IPC.connectionsRemove, id),
  testConnection: (id) => ipcRenderer.invoke(IPC.connectionsTest, id),
  listCollections: (id, parentPath) =>
    ipcRenderer.invoke(IPC.firestoreListCollections, id, parentPath),
  listDocuments: (id, path, limit, offset) =>
    ipcRenderer.invoke(IPC.firestoreListDocuments, id, path, limit, offset),
  getDocument: (id, path) => ipcRenderer.invoke(IPC.firestoreGetDocument, id, path),
  runQuery: (id, spec) => ipcRenderer.invoke(IPC.firestoreRunQuery, id, spec),
  runJsQuery: (id, code) => ipcRenderer.invoke(IPC.firestoreRunJsQuery, id, code),
  saveDocument: (id, doc) => ipcRenderer.invoke(IPC.firestoreSaveDocument, id, doc),
  deleteDocument: (id, path) => ipcRenderer.invoke(IPC.firestoreDeleteDocument, id, path),
  importDocuments: (id, path, docs, mode) =>
    ipcRenderer.invoke(IPC.firestoreImportDocuments, id, path, docs, mode),
  readCollection: (id, path) => ipcRenderer.invoke(IPC.firestoreReadCollection, id, path),
  restoreCollection: (id, backup, mode) =>
    ipcRenderer.invoke(IPC.firestoreRestoreCollection, id, backup, mode),
  getSchema: (id) => ipcRenderer.invoke(IPC.firestoreGetSchema, id),
  listModels: (host) => ipcRenderer.invoke(IPC.ollamaListModels, host),
  generateQuery: (input) => ipcRenderer.invoke(IPC.ollamaGenerateQuery, input),
  generateQueryStream: (input, onChunk, onDone, onError) => {
    const streamId = crypto.randomUUID();
    const ch = streamChannels(streamId);
    let active = true;
    function chunkHandler(_: IpcRendererEvent, text: string) {
      if (active) onChunk(text);
    }
    function cleanup() {
      active = false;
      ipcRenderer.removeListener(ch.chunk, chunkHandler);
    }
    ipcRenderer.on(ch.chunk, chunkHandler);
    ipcRenderer.once(ch.done, (_: IpcRendererEvent, result: GeneratedQuery) => {
      cleanup();
      onDone(result);
    });
    ipcRenderer.once(ch.error, (_: IpcRendererEvent, error: string) => {
      cleanup();
      onError(error);
    });
    ipcRenderer.send(IPC.ollamaGenerateQueryStream, input, streamId);
    return cleanup;
  },
  saveFile: (suggestedName, content, filters) =>
    ipcRenderer.invoke(IPC.filesSave, suggestedName, content, filters),
  openFile: (filters) => ipcRenderer.invoke(IPC.filesOpen, filters),
  listQueryHistory: () => ipcRenderer.invoke(IPC.queriesListHistory),
  recordQuery: (input) => ipcRenderer.invoke(IPC.queriesRecord, input),
  listSavedQueries: () => ipcRenderer.invoke(IPC.queriesListSaved),
  saveQuery: (input) => ipcRenderer.invoke(IPC.queriesSave, input),
  deleteSavedQuery: (id) => ipcRenderer.invoke(IPC.queriesDeleteSaved, id),
  getActiveRules: (id) => ipcRenderer.invoke(IPC.rulesGetActive, id),
  getSettings: () => ipcRenderer.invoke(IPC.settingsGet),
  saveSettings: (settings) => ipcRenderer.invoke(IPC.settingsSave, settings),
};

contextBridge.exposeInMainWorld('api', api);
