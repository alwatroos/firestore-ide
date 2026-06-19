import { COUNT_SENTINEL_ID, type DocumentRecord } from '@shared/types/firestore';
import { describe, expect, it } from 'vitest';
import { addCost, estimateReads, ZERO_COST } from './cost';

const doc = (id: string): DocumentRecord => ({ id, path: `c/${id}`, data: {} });

describe('estimateReads', () => {
  it('counts one read per returned document', () => {
    expect(estimateReads([doc('1'), doc('2'), doc('3')])).toBe(3);
  });

  it('bills at least one read for an empty result', () => {
    expect(estimateReads([])).toBe(1);
  });

  it('treats a count aggregation as a single read', () => {
    expect(
      estimateReads([{ id: COUNT_SENTINEL_ID, path: COUNT_SENTINEL_ID, data: { count: 999 } }])
    ).toBe(1);
  });
});

describe('addCost', () => {
  it('accumulates partial deltas immutably', () => {
    const after = addCost(ZERO_COST, { reads: 5 });
    expect(after).toEqual({ reads: 5, writes: 0, deletes: 0 });
    expect(addCost(after, { writes: 1, deletes: 2 })).toEqual({ reads: 5, writes: 1, deletes: 2 });
    expect(ZERO_COST).toEqual({ reads: 0, writes: 0, deletes: 0 });
  });
});
