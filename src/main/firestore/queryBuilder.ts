import type { QuerySpec } from '@shared/types/firestore'
import type { Query } from 'firebase-admin/firestore'

/**
 * Apply only the `where` filters from a {@link QuerySpec} to a base query,
 * leaving order and limit untouched. Used for count aggregation queries.
 *
 * @param base - The starting collection query.
 * @param spec - Spec whose filters are applied.
 * @returns A new query with filters applied.
 */
export function applyFiltersOnly(base: Query, spec: QuerySpec): Query {
  let q = base
  for (const f of spec.filters ?? []) q = q.where(f.field, f.operator, f.value)
  return q
}

/**
 * Apply a full declarative {@link QuerySpec} (filters, order, limit) to a query.
 *
 * @param base - The starting collection query.
 * @param spec - Declarative filters, ordering and limit.
 * @returns A new query with all clauses applied.
 */
export function applySpec(base: Query, spec: QuerySpec): Query {
  const filtered = applyFiltersOnly(base, spec)
  const ordered = spec.order ? filtered.orderBy(spec.order.field, spec.order.direction) : filtered
  return ordered.limit(clampLimit(spec.limit))
}

/**
 * Constrain a requested limit to a safe, performant range.
 *
 * @param limit - Requested document limit, if any.
 * @returns A bounded limit between 1 and 500 (default 50).
 */
export function clampLimit(limit?: number): number {
  if (!limit || limit < 1) return 50
  return Math.min(limit, 500)
}
