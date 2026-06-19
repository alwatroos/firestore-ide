import { describe, expect, it } from 'vitest';
import { toQuerySpec } from './querySpec';

describe('toQuerySpec', () => {
  it('returns a spec with only collectionPath when extras are absent', () => {
    const spec = toQuerySpec({ collectionPath: 'users' });
    expect(spec).toEqual({
      collectionPath: 'users',
      filters: [],
      order: undefined,
      limit: undefined,
    });
  });

  it('carries through filters, order and limit when all are provided', () => {
    const input = {
      collectionPath: 'orders',
      filters: [{ field: 'status', operator: '==', value: 'active' }],
      order: { field: 'createdAt', direction: 'desc' },
      limit: 10,
    };
    const spec = toQuerySpec(input);
    expect(spec.collectionPath).toBe('orders');
    expect(spec.filters).toHaveLength(1);
    expect(spec.order).toEqual({ field: 'createdAt', direction: 'desc' });
    expect(spec.limit).toBe(10);
  });

  it('defaults filters to [] when the field is absent', () => {
    const spec = toQuerySpec({ collectionPath: 'products' });
    expect(spec.filters).toEqual([]);
  });

  it('defaults filters to [] when the field is not an array', () => {
    const spec = toQuerySpec({ collectionPath: 'products', filters: 'invalid' });
    expect(spec.filters).toEqual([]);
  });

  it('ignores a non-numeric limit', () => {
    const spec = toQuerySpec({ collectionPath: 'items', limit: 'ten' });
    expect(spec.limit).toBeUndefined();
  });

  it('carries the collectionGroup flag only when explicitly true', () => {
    expect(toQuerySpec({ collectionPath: 'orders', collectionGroup: true }).collectionGroup).toBe(
      true
    );
    expect(toQuerySpec({ collectionPath: 'orders' }).collectionGroup).toBeUndefined();
  });

  it('throws when collectionPath is absent', () => {
    expect(() => toQuerySpec({})).toThrow('collectionPath (string) is required');
  });

  it('throws when collectionPath is not a string', () => {
    expect(() => toQuerySpec({ collectionPath: 42 })).toThrow(
      'collectionPath (string) is required'
    );
  });

  it('throws when collectionPath is an empty string', () => {
    expect(() => toQuerySpec({ collectionPath: '' })).toThrow(
      'collectionPath (string) is required'
    );
  });
});
