import type { QueryOperator, QuerySpec } from '@shared/types/firestore'

/** Operators that cannot be served efficiently by an index (risk a wide scan). */
const FULL_SCAN_OPERATORS: ReadonlySet<QueryOperator> = new Set<QueryOperator>(['!='])

/** Inequality operators that, when combined across fields, need composite indexes. */
const INEQUALITY_OPERATORS: ReadonlySet<QueryOperator> = new Set<QueryOperator>([
  '<',
  '<=',
  '>',
  '>=',
  '!='
])

/** Limit above which a query is flagged as potentially expensive. */
const LARGE_LIMIT = 200

/**
 * Produce best-effort advisory warnings about a declarative query's cost or
 * efficiency. These never block execution — they only inform the user.
 *
 * @param spec - The query specification to inspect.
 * @returns Zero or more human-readable warning messages.
 */
export function queryWarnings(spec: QuerySpec): string[] {
  const warnings: string[] = []
  const filters = spec.filters ?? []

  if (!spec.aggregate && spec.limit === undefined) {
    warnings.push('No limit set — a default limit is applied, but an unbounded query could read an entire collection.')
  }

  for (const filter of filters) {
    if (FULL_SCAN_OPERATORS.has(filter.operator)) {
      warnings.push(`Operator "${filter.operator}" on "${filter.field}" cannot use an index efficiently and may scan many documents.`)
    }
  }

  const inequalityFields = new Set(
    filters.filter((filter) => INEQUALITY_OPERATORS.has(filter.operator)).map((filter) => filter.field)
  )
  if (inequalityFields.size > 1) {
    warnings.push('Inequality filters span multiple fields, which Firestore supports only with composite indexes.')
  }

  if (spec.limit !== undefined && spec.limit > LARGE_LIMIT) {
    warnings.push(`A large limit (${spec.limit}) may read many documents and increase cost.`)
  }

  return warnings
}
