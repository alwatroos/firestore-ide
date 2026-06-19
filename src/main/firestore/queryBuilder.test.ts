import type { QuerySpec } from '@shared/types/firestore';
import { describe, expect, it } from 'vitest';
import { applyFiltersOnly, applySpec, clampLimit } from './queryBuilder';

/** Minimal chainable query double that records method calls. */
function makeQueryMock() {
  const calls: string[] = [];
  const q: Record<string, (...args: unknown[]) => typeof q> = {};
  const record =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push(`${name}(${args.map(String).join(',')})`);
      return q;
    };
  q.where = record('where');
  q.orderBy = record('orderBy');
  q.limit = record('limit');
  return { q, calls };
}

describe('clampLimit', () => {
  it('defaults to 50 when unset or invalid', () => {
    expect(clampLimit()).toBe(50);
    expect(clampLimit(0)).toBe(50);
  });

  it('caps at 500', () => {
    expect(clampLimit(9999)).toBe(500);
  });

  it('keeps values within range', () => {
    expect(clampLimit(10)).toBe(10);
  });
});

describe('applyFiltersOnly', () => {
  it('returns the base query unchanged when filters is empty', () => {
    const { q, calls } = makeQueryMock();
    const spec: QuerySpec = { collectionPath: 'users' };
    applyFiltersOnly(q as never, spec);
    expect(calls).toEqual([]);
  });

  it('calls where() for each filter', () => {
    const { q, calls } = makeQueryMock();
    const spec: QuerySpec = {
      collectionPath: 'orders',
      filters: [
        { field: 'status', operator: '==', value: 'active' },
        { field: 'price', operator: '>', value: 10 },
      ],
    };
    applyFiltersOnly(q as never, spec);
    expect(calls).toEqual(['where(status,==,active)', 'where(price,>,10)']);
  });

  it('does NOT call orderBy or limit', () => {
    const { q, calls } = makeQueryMock();
    applyFiltersOnly(q as never, {
      collectionPath: 'x',
      filters: [{ field: 'a', operator: '==', value: 1 }],
      order: { field: 'a', direction: 'asc' },
      limit: 5,
    });
    expect(calls.some((c) => c.startsWith('orderBy') || c.startsWith('limit'))).toBe(false);
  });
});

describe('applySpec', () => {
  it('applies filters, order and limit in sequence', () => {
    const { q, calls } = makeQueryMock();
    const spec: QuerySpec = {
      collectionPath: 'products',
      filters: [{ field: 'active', operator: '==', value: true }],
      order: { field: 'name', direction: 'asc' },
      limit: 25,
    };
    applySpec(q as never, spec);
    expect(calls).toEqual(['where(active,==,true)', 'orderBy(name,asc)', 'limit(25)']);
  });

  it('skips orderBy when order is absent', () => {
    const { q, calls } = makeQueryMock();
    applySpec(q as never, { collectionPath: 'x', limit: 10 });
    expect(calls).toEqual(['limit(10)']);
  });

  it('uses clamped default limit when none is provided', () => {
    const { q, calls } = makeQueryMock();
    applySpec(q as never, { collectionPath: 'x' });
    expect(calls).toEqual(['limit(50)']);
  });
});
