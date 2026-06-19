import type { QuerySpec } from '@shared/types/firestore';
import { describe, expect, it } from 'vitest';
import { queryWarnings } from './queryWarnings';

describe('queryWarnings', () => {
  it('warns when a non-aggregate query has no limit', () => {
    const warnings = queryWarnings({ collectionPath: 'users' });
    expect(warnings.some((w) => w.includes('No limit'))).toBe(true);
  });

  it('does not warn about limit for aggregations', () => {
    const warnings = queryWarnings({ collectionPath: 'users', aggregate: 'count' });
    expect(warnings.some((w) => w.includes('No limit'))).toBe(false);
  });

  it('flags full-scan operators', () => {
    const spec: QuerySpec = {
      collectionPath: 'users',
      limit: 10,
      filters: [{ field: 'role', operator: '!=', value: 'admin' }],
    };
    expect(queryWarnings(spec).some((w) => w.includes('!='))).toBe(true);
  });

  it('flags inequalities across multiple fields', () => {
    const spec: QuerySpec = {
      collectionPath: 'users',
      limit: 10,
      filters: [
        { field: 'age', operator: '>', value: 18 },
        { field: 'score', operator: '<', value: 100 },
      ],
    };
    expect(queryWarnings(spec).some((w) => w.includes('multiple fields'))).toBe(true);
  });

  it('flags a large limit', () => {
    expect(
      queryWarnings({ collectionPath: 'users', limit: 500 }).some((w) => w.includes('large limit'))
    ).toBe(true);
  });

  it('is silent for a well-formed bounded query', () => {
    expect(queryWarnings({ collectionPath: 'users', limit: 25 })).toEqual([]);
  });
});
