import { FIELD_MARKERS } from '@shared/types/firestore';
import { formatMarker, markerKind } from '@shared/utils/markers';
import type { ReactNode } from 'react';
import { formatCell } from './columns';

/** Props for {@link CellValue}. */
interface CellValueProps {
  /** The field value to render. */
  value: unknown;
  /** When provided, `DocumentReference` values render as a clickable link. */
  onOpenRef?: (path: string) => void;
}

/**
 * Render a table cell value. `DocumentReference` markers become clickable links
 * that follow the reference; everything else falls back to {@link formatCell}.
 *
 * @param props - The value and an optional reference-follow handler.
 * @returns The rendered cell content.
 */
export function CellValue({ value, onOpenRef }: CellValueProps): ReactNode {
  if (value && typeof value === 'object' && markerKind(value) === 'reference' && onOpenRef) {
    const record = value as Record<string, unknown>;
    const path = String(record[FIELD_MARKERS.reference]);
    return (
      <button
        type="button"
        className="text-blue-600 dark:text-blue-400 hover:underline"
        onClick={(event) => {
          event.stopPropagation();
          onOpenRef(path);
        }}
      >
        {formatMarker(record, 'reference')}
      </button>
    );
  }
  return <>{formatCell(value)}</>;
}
