import type { DocumentRecord } from '@shared/types/firestore';
import type { CollectionBackup, ImportDoc, ImportMode } from '@shared/types/transfer';
import { useCallback } from 'react';
import { api, unwrap } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { toCsv, toJson } from './export';

/** Result of picking and parsing an import file. */
export interface ParsedImport {
  /** Chosen file name. */
  name: string;
  /** Parsed documents to import. */
  docs: ImportDoc[];
}

/** Result of picking and parsing a backup file. */
export interface ParsedBackup {
  /** Chosen file name. */
  name: string;
  /** Parsed collection backup. */
  backup: CollectionBackup;
}

/** Derive a filesystem-safe base name from a collection path. */
function fileBase(collectionPath: string): string {
  return collectionPath.replace(/\//g, '_') || 'export';
}

/**
 * Export, import, backup and restore actions for the active connection. All
 * actions share busy/error state via {@link useAsync}; file dialogs run in main.
 *
 * @param connectionId - Active connection id, or `null`.
 * @returns Transfer actions plus busy/error state.
 */
export function useTransfer(connectionId: string | null) {
  const { error, busy, run } = useAsync();

  const exportRecords = useCallback(
    (records: DocumentRecord[], format: 'json' | 'csv', baseName: string) =>
      run(async () => {
        const content = format === 'csv' ? toCsv(records) : toJson(records);
        await unwrap(
          api.saveFile(`${baseName}.${format}`, content, [
            { name: format.toUpperCase(), extensions: [format] },
          ])
        );
      }),
    [run]
  );

  const backup = useCallback(
    (collectionPath: string) => {
      if (!connectionId) return undefined;
      return run(async () => {
        const tree = await unwrap(api.readCollection(connectionId, collectionPath));
        await unwrap(
          api.saveFile(`${fileBase(collectionPath)}.backup.json`, JSON.stringify(tree, null, 2), [
            { name: 'JSON', extensions: ['json'] },
          ])
        );
      });
    },
    [connectionId, run]
  );

  const pickImport = useCallback(
    (): Promise<ParsedImport | undefined> =>
      run(async () => {
        const file = await unwrap(api.openFile([{ name: 'JSON', extensions: ['json'] }]));
        if (file.cancelled || !file.content) return undefined;
        const parsed = JSON.parse(file.content) as unknown;
        if (!Array.isArray(parsed))
          throw new Error('Import file must be a JSON array of documents');
        const docs: ImportDoc[] = parsed.map((entry) => normaliseImportDoc(entry));
        return { name: file.name ?? 'file', docs };
      }),
    [run]
  );

  const runImport = useCallback(
    (collectionPath: string, docs: ImportDoc[], mode: ImportMode) => {
      if (!connectionId) return undefined;
      return run(async () => unwrap(api.importDocuments(connectionId, collectionPath, docs, mode)));
    },
    [connectionId, run]
  );

  const pickRestore = useCallback(
    (): Promise<ParsedBackup | undefined> =>
      run(async () => {
        const file = await unwrap(api.openFile([{ name: 'JSON', extensions: ['json'] }]));
        if (file.cancelled || !file.content) return undefined;
        const backupData = JSON.parse(file.content) as CollectionBackup;
        if (!backupData.path || !Array.isArray(backupData.documents)) {
          throw new Error('Restore file is not a valid collection backup');
        }
        return { name: file.name ?? 'file', backup: backupData };
      }),
    [run]
  );

  const runRestore = useCallback(
    (backupData: CollectionBackup, mode: ImportMode) => {
      if (!connectionId) return undefined;
      return run(async () => unwrap(api.restoreCollection(connectionId, backupData, mode)));
    },
    [connectionId, run]
  );

  return { exportRecords, backup, pickImport, runImport, pickRestore, runRestore, error, busy };
}

/**
 * Coerce an arbitrary parsed entry into an {@link ImportDoc}.
 *
 * @param entry - One element of the parsed import array.
 * @returns A normalised import document.
 * @throws If the entry is not an object with a `data` object.
 */
function normaliseImportDoc(entry: unknown): ImportDoc {
  if (!entry || typeof entry !== 'object') throw new Error('Each import entry must be an object');
  const record = entry as Record<string, unknown>;
  const data = record.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Each import entry must have a "data" object');
  }
  return {
    ...(typeof record.id === 'string' ? { id: record.id } : {}),
    data: data as Record<string, unknown>,
  };
}
