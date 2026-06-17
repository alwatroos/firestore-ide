import { useAtom, useAtomValue } from 'jotai'
import { type ReactNode, useState } from 'react'
import { Empty, ErrorBanner } from '../../components/ui'
import { api, unwrap } from '../../lib/api'
import { useAsync } from '../../lib/useAsync'
import { activeConnectionAtom } from '../connections/atoms'
import { useOpenDocument } from '../documents/hooks'
import { selectedCollectionAtom } from './atoms'
import { useCollections } from './hooks'

/** Max document nodes loaded per collection in the tree (the table shows the full set). */
const TREE_DOC_LIMIT = 25

/** A single node in the data tree. */
interface NodeData {
  /** Whether this node is a collection or a document. */
  kind: 'collection' | 'document'
  /** Full Firestore path of the node. */
  path: string
  /** Short label (collection id or document id). */
  label: string
}

/** Props for {@link TreeNode}. */
interface TreeNodeProps {
  /** Active connection id. */
  connectionId: string
  /** The node to render. */
  node: NodeData
  /** Indentation depth. */
  depth: number
}

/**
 * Recursive tree node: collections expand into documents, documents expand into
 * their sub-collections. Children are loaded lazily on first expand.
 *
 * @param props - Connection id, node and depth.
 * @returns The rendered node and, when expanded, its children.
 */
function TreeNode({ connectionId, node, depth }: TreeNodeProps): ReactNode {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<NodeData[] | null>(null)
  const { error, busy, run } = useAsync()
  const [selectedCollection, setSelectedCollection] = useAtom(selectedCollectionAtom)
  const { open } = useOpenDocument(connectionId)

  /**
   * Fetch the node's children (documents for a collection, sub-collections for a document).
   *
   * @returns Resolves once children are loaded.
   */
  function loadChildren(): Promise<unknown> {
    return run(async () => {
      if (node.kind === 'collection') {
        const docs = await unwrap(api.listDocuments(connectionId, node.path, TREE_DOC_LIMIT))
        setChildren(docs.map((doc) => ({ kind: 'document', path: doc.path, label: doc.id })))
      } else {
        const cols = await unwrap(api.listCollections(connectionId, node.path))
        setChildren(
          cols.map((name) => ({ kind: 'collection', path: `${node.path}/${name}`, label: name }))
        )
      }
    })
  }

  /**
   * Toggle expansion, loading children on first open.
   *
   * @returns Nothing.
   */
  function toggle(): void {
    const next = !expanded
    setExpanded(next)
    if (next && children === null) void loadChildren()
  }

  /**
   * Select the node: collections load into the table, documents open in the editor.
   *
   * @returns Nothing.
   */
  function select(): void {
    if (node.kind === 'collection') setSelectedCollection(node.path)
    else void open(node.path)
  }

  const isSelected = node.kind === 'collection' && node.path === selectedCollection
  const icon = node.kind === 'collection' ? '📁' : '📄'
  return (
    <li>
      <div
        className={`flex items-center rounded text-sm ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300'
        }`}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <button
          type="button"
          className="w-4 shrink-0 text-xs text-slate-400"
          onClick={toggle}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {busy ? '…' : expanded ? '▾' : '▸'}
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 truncate px-1 py-1 text-left"
          onClick={select}
        >
          <span className="mr-1">{icon}</span>
          {node.label}
        </button>
      </div>
      <ErrorBanner message={error} />
      {expanded && children && (
        <ul>
          {children.length === 0 ? (
            <li
              className="px-2 py-0.5 text-xs text-slate-400 dark:text-slate-500"
              style={{ paddingLeft: `${(depth + 1) * 12}px` }}
            >
              {node.kind === 'collection' ? 'No documents' : 'No sub-collections'}
            </li>
          ) : (
            children.map((child) => (
              <TreeNode
                key={child.path}
                connectionId={connectionId}
                node={child}
                depth={depth + 1}
              />
            ))
          )}
        </ul>
      )}
    </li>
  )
}

/**
 * Hierarchical tree of collections, documents and sub-collections for the active
 * connection. Replaces the former flat collection list.
 *
 * @returns The rendered tree or an empty-state placeholder.
 */
export function CollectionTree(): ReactNode {
  const active = useAtomValue(activeConnectionAtom)
  const { collections, error } = useCollections(active?.id ?? null)
  if (!active) return <Empty text="Select a connection above" />
  if (collections.length === 0) return <Empty text="No collections found" />
  return (
    <>
      <ErrorBanner message={error} />
      <ul className="space-y-0.5 p-2">
        {collections.map((name) => (
          <TreeNode
            key={name}
            connectionId={active.id}
            node={{ kind: 'collection', path: name, label: name }}
            depth={0}
          />
        ))}
      </ul>
    </>
  )
}
