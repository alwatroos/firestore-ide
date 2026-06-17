import type { QueryAggregate, QuerySpec } from '@shared/types/firestore'

/**
 * Parse and validate the model's JSON response into a {@link QuerySpec}.
 *
 * @param raw - Raw JSON string returned by the model.
 * @returns A normalised, runnable query specification.
 * @throws If the JSON is invalid or lacks a `collectionPath`.
 */
export function parseQuerySpec(raw: string): QuerySpec {
  const parsed = JSON.parse(raw) as Partial<QuerySpec>
  if (!parsed.collectionPath || typeof parsed.collectionPath !== 'string') {
    throw new Error('Model response did not include a valid collectionPath')
  }
  const validAggregates: QueryAggregate[] = ['count', 'sum', 'avg']
  const aggregate =
    parsed.aggregate && validAggregates.includes(parsed.aggregate) ? parsed.aggregate : undefined
  return {
    collectionPath: parsed.collectionPath,
    ...(parsed.collectionGroup === true ? { collectionGroup: true } : {}),
    filters: Array.isArray(parsed.filters) ? parsed.filters : [],
    order: parsed.order ?? undefined,
    limit: typeof parsed.limit === 'number' ? parsed.limit : undefined,
    aggregate,
    aggregateField: typeof parsed.aggregateField === 'string' ? parsed.aggregateField : undefined,
  }
}
