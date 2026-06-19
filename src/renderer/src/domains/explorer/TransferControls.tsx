import type { ImportMode } from '@shared/types/transfer';
import { useAtomValue, useSetAtom } from 'jotai';
import { type ReactNode, useState } from 'react';
import { Button, ConfirmDialog, ErrorBanner } from '../../components/ui';
import { activeConnectionAtom } from '../connections/atoms';
import { useReadOnly } from '../connections/hooks';
import { documentsAtom, documentsVersionAtom, selectedCollectionAtom } from './atoms';
import { type ParsedBackup, type ParsedImport, useTransfer } from './useTransfer';

/** A small overwrite/merge selector shared by the import and restore dialogs. */
function ModePicker({
  mode,
  onChange,
}: {
  mode: ImportMode;
  onChange: (m: ImportMode) => void;
}): ReactNode {
  return (
    <div className="mt-2 flex gap-3 text-sm">
      {(['overwrite', 'merge'] as const).map((option) => (
        <label key={option} className="flex items-center gap-1">
          <input type="radio" checked={mode === option} onChange={() => onChange(option)} />
          {option === 'overwrite' ? 'Overwrite' : 'Merge'}
        </label>
      ))}
    </div>
  );
}

/**
 * Export / import / backup / restore controls for the selected collection.
 * Import and restore confirm with a preview and an overwrite/merge choice, and
 * are disabled while read-only.
 *
 * @returns The rendered controls, or `null` when no collection is selected.
 */
export function TransferControls(): ReactNode {
  const active = useAtomValue(activeConnectionAtom);
  const collection = useAtomValue(selectedCollectionAtom);
  const documents = useAtomValue(documentsAtom);
  const bumpVersion = useSetAtom(documentsVersionAtom);
  const readOnly = useReadOnly();
  const { exportRecords, backup, pickImport, runImport, pickRestore, runRestore, error, busy } =
    useTransfer(active?.id ?? null);
  const [pendingImport, setPendingImport] = useState<ParsedImport | null>(null);
  const [pendingRestore, setPendingRestore] = useState<ParsedBackup | null>(null);
  const [mode, setMode] = useState<ImportMode>('overwrite');

  if (!collection) return null;
  const base = collection.replace(/\//g, '_');

  /** Pick an import file and open the confirmation dialog when one is parsed. */
  async function onImport(): Promise<void> {
    const parsed = await pickImport();
    if (parsed) {
      setMode('overwrite');
      setPendingImport(parsed);
    }
  }

  /** Pick a backup file and open the restore confirmation when one is parsed. */
  async function onRestore(): Promise<void> {
    const parsed = await pickRestore();
    if (parsed) {
      setMode('overwrite');
      setPendingRestore(parsed);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        variant="ghost"
        disabled={busy || documents.length === 0}
        onClick={() => void exportRecords(documents, 'json', base)}
      >
        Export JSON
      </Button>
      <Button
        variant="ghost"
        disabled={busy || documents.length === 0}
        onClick={() => void exportRecords(documents, 'csv', base)}
      >
        Export CSV
      </Button>
      <Button variant="ghost" disabled={busy} onClick={() => void backup(collection)}>
        Backup
      </Button>
      <Button variant="ghost" disabled={busy || readOnly} onClick={() => void onImport()}>
        Import
      </Button>
      <Button variant="ghost" disabled={busy || readOnly} onClick={() => void onRestore()}>
        Restore
      </Button>
      <ErrorBanner message={error} />

      {pendingImport && (
        <ConfirmDialog
          title="Import documents?"
          confirmLabel="Import"
          busy={busy}
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            void runImport(collection, pendingImport.docs, mode)?.then(() => {
              setPendingImport(null);
              bumpVersion((value) => value + 1);
            });
          }}
        >
          <p>
            Import <strong>{pendingImport.docs.length}</strong> document(s) from{' '}
            <code>{pendingImport.name}</code> into <code>{collection}</code>.
          </p>
          <ModePicker mode={mode} onChange={setMode} />
        </ConfirmDialog>
      )}

      {pendingRestore && (
        <ConfirmDialog
          title="Restore backup?"
          confirmLabel="Restore"
          danger
          busy={busy}
          onCancel={() => setPendingRestore(null)}
          onConfirm={() => {
            void runRestore(pendingRestore.backup, mode)?.then(() => {
              setPendingRestore(null);
              bumpVersion((value) => value + 1);
            });
          }}
        >
          <p>
            Restore <strong>{pendingRestore.backup.documents.length}</strong> top-level document(s)
            (plus any sub-collections) from <code>{pendingRestore.name}</code> into{' '}
            <code>{pendingRestore.backup.path}</code>.
          </p>
          <ModePicker mode={mode} onChange={setMode} />
        </ConfirmDialog>
      )}
    </div>
  );
}
