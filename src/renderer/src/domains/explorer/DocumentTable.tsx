import { useAtomValue, useSetAtom } from 'jotai'
import type { ReactNode } from 'react'
import type { DocumentRecord } from '@shared/types/firestore'
import { Button, Empty, ErrorBanner } from '../../components/ui'
import { activeConnectionAtom } from '../connections/atoms'
import { selectedDocumentAtom } from '../documents/atoms'
import { selectedCollectionAtom } from './atoms'
import { collectColumns, formatCell } from './columns'
import { useDocuments } from './hooks'

/**
 * Build a blank document record for a new entry in the collection.
 *
 * @param collection - Collection path the document belongs to.
 * @returns An empty document with a generated id.
 */
function blankDocument(collection: string): DocumentRecord {
  const id = crypto.randomUUID()
  return { id, path: `${collection}/${id}`, data: {} }
}

/**
 * Toolbar with collection name and new/refresh actions.
 *
 * @param props - Collection name plus new/refresh handlers.
 * @returns The rendered toolbar.
 */
function Toolbar(props: { name: string; onNew: () => void; onRefresh: () => void }): ReactNode {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
      <h2 className="truncate text-sm font-semibold text-slate-700">{props.name}</h2>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={props.onRefresh}>
          Refresh
        </Button>
        <Button onClick={props.onNew}>New</Button>
      </div>
    </div>
  )
}

/**
 * Tabular, readable view of the selected collection's documents.
 *
 * @returns The rendered table or an empty-state placeholder.
 */
export function DocumentTable(): ReactNode {
  const active = useAtomValue(activeConnectionAtom)
  const collection = useAtomValue(selectedCollectionAtom)
  const { documents, error, refresh } = useDocuments(active?.id ?? null, collection)
  const setDocument = useSetAtom(selectedDocumentAtom)
  if (!collection) return <Empty text="Select a collection to view documents" />
  const columns = collectColumns(documents)
  return (
    <div className="flex h-full flex-col">
      <Toolbar
        name={collection}
        onRefresh={() => void refresh()}
        onNew={() => setDocument(blankDocument(collection))}
      />
      <ErrorBanner message={error} />
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-slate-100 text-slate-600">
            <tr>
              <th className="px-3 py-1.5 font-semibold">id</th>
              {columns.map((column) => (
                <th key={column} className="px-3 py-1.5 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.path}
                onClick={() => setDocument(doc)}
                className="cursor-pointer border-b border-slate-100 hover:bg-blue-50"
              >
                <td className="px-3 py-1.5 font-mono text-slate-500">{doc.id}</td>
                {columns.map((column) => (
                  <td key={column} className="max-w-xs truncate px-3 py-1.5">
                    {formatCell(doc.data[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {documents.length === 0 && <Empty text="No documents" />}
      </div>
    </div>
  )
}
