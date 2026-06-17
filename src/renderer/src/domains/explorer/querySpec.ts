import type { QueryAggregate, QueryFilter, QueryOrder, QuerySpec } from '@shared/types/firestore'

/**
 * Coerce a parsed JSON object into a {@link QuerySpec}, validating required fields.
 *
 * @param json - Parsed JSON object supplied by the user.
 * @returns A valid, runnable query specification.
 * @throws {Error} If `collectionPath` is absent or not a string.
 */
export function toQuerySpec(json: Record<string, unknown>): QuerySpec {
  if (!json.collectionPath || typeof json.collectionPath !== 'string') {
    throw new Error('collectionPath (string) is required')
  }
  const validAggregates: QueryAggregate[] = ['count', 'sum', 'avg']
  const aggregate =
    json.aggregate && validAggregates.includes(json.aggregate as QueryAggregate)
      ? (json.aggregate as QueryAggregate)
      : undefined
  return {
    collectionPath: json.collectionPath,
    ...(json.collectionGroup === true ? { collectionGroup: true } : {}),
    filters: Array.isArray(json.filters) ? (json.filters as QueryFilter[]) : [],
    order: json.order != null ? (json.order as QueryOrder) : undefined,
    limit: typeof json.limit === 'number' ? json.limit : undefined,
    ...(aggregate ? { aggregate } : {}),
    ...(typeof json.aggregateField === 'string' ? { aggregateField: json.aggregateField } : {})
  }
}
