import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import type { ReactNode } from 'react'
import { Empty, ErrorBanner } from '../../components/ui'
import { activeConnectionAtom } from '../connections/atoms'
import { selectedDocumentAtom } from '../documents/atoms'
import { selectedCollectionAtom } from './atoms'
import { useCollections } from './hooks'

/**
 * Sidebar list of collections for the active connection.
 *
 * @returns The rendered collection list or an empty-state placeholder.
 */
export function CollectionList(): ReactNode {
  const active = useAtomValue(activeConnectionAtom)
  const { collections, error } = useCollections(active?.id ?? null)
  const [selected, setSelected] = useAtom(selectedCollectionAtom)
  const setDocument = useSetAtom(selectedDocumentAtom)
  if (!active) return <Empty text="Select a connection above" />
  if (collections.length === 0) return <Empty text="No collections found" />
  return (
    <>
      <ErrorBanner message={error} />
      <ul className="space-y-0.5 p-2">
        {collections.map((name) => (
          <li key={name}>
            <button
              onClick={() => {
                setSelected(name)
                setDocument(null)
              }}
              className={`w-full truncate rounded px-2 py-1 text-left text-sm ${
                name === selected ? 'bg-blue-100 text-blue-800' : 'hover:bg-slate-100'
              }`}
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
