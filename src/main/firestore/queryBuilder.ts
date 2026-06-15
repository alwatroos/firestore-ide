import type { Query } from 'firebase-admin/firestore'
import type { QuerySpec } from '@shared/types/firestore'

/**
 * Apply a declarative {@link QuerySpec} to a base Firestore query.
 *
 * @param base - The starting collection query.
 * @param spec - Declarative filters, ordering and limit.
 * @returns A new query with all clauses applied.
 */
export function applySpec(base: Query, spec: QuerySpec): Query {
  let query = base
  for (const filter of spec.filters ?? []) {
    query = query.where(filter.field, filter.operator, filter.value)
  }
  if (spec.order) query = query.orderBy(spec.order.field, spec.order.direction)
  return query.limit(clampLimit(spec.limit))
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
