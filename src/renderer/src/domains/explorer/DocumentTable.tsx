import type { DocumentRecord } from '@shared/types/firestore';
import { useAtomValue, useSetAtom } from 'jotai';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Empty, ErrorBanner } from '../../components/ui';
import { activeConnectionAtom } from '../connections/atoms';
import { useReadOnly } from '../connections/hooks';
import { selectedDocumentAtom } from '../documents/atoms';
import { useOpenDocument } from '../documents/hooks';
import { selectedCollectionAtom } from './atoms';
import { CellValue } from './CellValue';
import { collectColumns } from './columns';
import { useDocuments } from './hooks';
import { TransferControls } from './TransferControls';

/** Approximate height of each data row in pixels (matches py-1.5 + text-xs). */
const ROW_HEIGHT = 28;
/** Extra rows to render above and below the visible window. */
const OVERSCAN = 5;

/** Direction of a column sort. */
type SortDir = 'asc' | 'desc';

/** Active sort state: which column and which direction. */
interface SortState {
  column: string;
  dir: SortDir;
}

/**
 * Compare two cell values for sorting: numbers numerically, everything else as strings.
 * Null/undefined values sort to the end regardless of direction.
 *
 * @param a - Left-hand value.
 * @param b - Right-hand value.
 * @returns Negative, zero, or positive comparison result.
 */
function compareValues(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

/**
 * Build a blank document record for a new entry in the collection.
 *
 * @param collection - Collection path the document belongs to.
 * @returns An empty document with a generated id.
 */
function blankDocument(collection: string): DocumentRecord {
  const id = crypto.randomUUID();
  return { id, path: `${collection}/${id}`, data: {} };
}

/** Props for {@link Toolbar}. */
interface ToolbarProps {
  name: string;
  count: number;
  hasMore: boolean;
  canCreate: boolean;
  onNew: () => void;
  onRefresh: () => void;
}

/**
 * Toolbar with collection name, document count and new/refresh actions.
 *
 * @param props - Collection name, count and action handlers.
 * @returns The rendered toolbar.
 */
function Toolbar({ name, count, hasMore, canCreate, onNew, onRefresh }: ToolbarProps): ReactNode {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate text-sm font-semibold text-slate-700 dark:text-slate-300">
          {name}
        </h2>
        <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
          {count}
          {hasMore ? '+' : ''} docs
        </span>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" onClick={onRefresh}>
          Refresh
        </Button>
        <Button onClick={onNew} disabled={!canCreate}>
          New
        </Button>
      </div>
    </div>
  );
}

/** Props for {@link SortIndicator}. */
interface SortIndicatorProps {
  column: string;
  sort: SortState | null;
}

/**
 * Inline sort indicator shown next to a column header.
 * Shows ↑/↓ when this column is sorted, or a faint ↕ on hover otherwise.
 *
 * @param props - Column name and current sort state.
 * @returns The rendered indicator span.
 */
function SortIndicator({ column, sort }: SortIndicatorProps): ReactNode {
  if (sort?.column === column) {
    return <span className="ml-1">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  }
  return <span className="ml-1 opacity-0 group-hover:opacity-40">↕</span>;
}

/** Props for {@link DocRow}. */
interface DocRowProps {
  doc: DocumentRecord;
  columns: string[];
  onClick: () => void;
  onOpenRef: (path: string) => void;
}

/**
 * A single document row in the table.
 *
 * @param props - Document data, column keys, click and reference-follow handlers.
 * @returns The rendered table row.
 */
function DocRow({ doc, columns, onClick, onOpenRef }: DocRowProps): ReactNode {
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-b border-slate-100 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30"
    >
      <td className="px-3 py-1.5 font-mono text-slate-500 dark:text-slate-400">{doc.id}</td>
      {columns.map((col) => (
        <td key={col} className="max-w-xs truncate px-3 py-1.5">
          <CellValue value={doc.data[col]} onOpenRef={onOpenRef} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Virtual table body: renders only the rows within the visible viewport plus
 * an overscan buffer, using spacer rows to preserve total scroll height.
 * This keeps DOM node count low regardless of how many documents are loaded.
 *
 * @param props - All loaded documents, visible columns, scroll position and container height.
 * @returns The rendered tbody with spacers and visible rows.
 */
function VirtualBody({
  documents,
  columns,
  scrollTop,
  containerHeight,
  onSelect,
  onOpenRef,
}: {
  documents: DocumentRecord[];
  columns: string[];
  scrollTop: number;
  containerHeight: number;
  onSelect: (doc: DocumentRecord) => void;
  onOpenRef: (path: string) => void;
}): ReactNode {
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(
    documents.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN
  );
  const paddingTop = start * ROW_HEIGHT;
  const paddingBottom = (documents.length - end) * ROW_HEIGHT;
  const colCount = columns.length + 1;

  return (
    <tbody>
      {paddingTop > 0 && (
        <tr>
          <td colSpan={colCount} style={{ height: paddingTop, padding: 0 }} />
        </tr>
      )}
      {documents.slice(start, end).map((doc) => (
        <DocRow
          key={doc.path}
          doc={doc}
          columns={columns}
          onClick={() => onSelect(doc)}
          onOpenRef={onOpenRef}
        />
      ))}
      {paddingBottom > 0 && (
        <tr>
          <td colSpan={colCount} style={{ height: paddingBottom, padding: 0 }} />
        </tr>
      )}
    </tbody>
  );
}

/**
 * Tabular, readable view of the selected collection's documents.
 * Supports column sorting (click header to cycle asc → desc → off) and
 * virtualizes the DOM (only visible rows rendered). Auto-loads the next
 * page via IntersectionObserver when the user scrolls to the bottom.
 *
 * @returns The rendered table or an empty-state placeholder.
 */
export function DocumentTable(): ReactNode {
  const active = useAtomValue(activeConnectionAtom);
  const collection = useAtomValue(selectedCollectionAtom);
  const { documents, error, busy, refresh, loadMore, hasMore } = useDocuments(
    active?.id ?? null,
    collection
  );
  const setDocument = useSetAtom(selectedDocumentAtom);
  const readOnly = useReadOnly();
  const { open: openRef } = useOpenDocument(active?.id ?? null);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);
  const [sort, setSort] = useState<SortState | null>(null);

  // Track container height for virtual window calculation.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerHeight(el.clientHeight);
    const ro = new ResizeObserver(([entry]) => setContainerHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-load when the sentinel div becomes visible at the bottom.
  const loadMoreStable = useCallback(() => loadMore(), [loadMore]);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || busy) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadMoreStable();
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, busy, loadMoreStable]);

  /**
   * Cycle sort for a column: none → asc → desc → none.
   *
   * @param column - Column key that was clicked.
   */
  function handleSort(column: string): void {
    setSort((prev) => {
      if (!prev || prev.column !== column) return { column, dir: 'asc' };
      if (prev.dir === 'asc') return { column, dir: 'desc' };
      return null;
    });
  }

  const sortedDocuments = useMemo(() => {
    if (!sort) return documents;
    return [...documents].sort((a, b) => {
      const aVal = sort.column === 'id' ? a.id : a.data[sort.column];
      const bVal = sort.column === 'id' ? b.id : b.data[sort.column];
      const cmp = compareValues(aVal, bVal);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [documents, sort]);

  if (!collection) return <Empty text="Select a collection to view documents" />;

  const columns = collectColumns(documents);

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        name={collection}
        count={documents.length}
        hasMore={hasMore}
        canCreate={!readOnly}
        onRefresh={() => void refresh()}
        onNew={() => setDocument(blankDocument(collection))}
      />
      <div className="flex shrink-0 items-center gap-1 border-b border-slate-200 dark:border-slate-700 px-4 py-1">
        <TransferControls />
      </div>
      <ErrorBanner message={error} />
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      >
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <tr>
              <th
                onClick={() => handleSort('id')}
                className="group cursor-pointer select-none px-3 py-1.5 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                id
                <SortIndicator column="id" sort={sort} />
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="group cursor-pointer select-none px-3 py-1.5 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {col}
                  <SortIndicator column={col} sort={sort} />
                </th>
              ))}
            </tr>
          </thead>
          <VirtualBody
            documents={sortedDocuments}
            columns={columns}
            scrollTop={scrollTop}
            containerHeight={containerHeight}
            onSelect={setDocument}
            onOpenRef={(path) => void openRef(path)}
          />
        </table>
        {documents.length === 0 && !busy && <Empty text="No documents" />}
        {busy && (
          <div className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
            Loading…
          </div>
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}
