import type { DocumentRecord } from '@shared/types/firestore';
import { describe, expect, it } from 'vitest';
import { toCsv, toJson } from './export';

const records: DocumentRecord[] = [
  { id: '1', path: 'c/1', data: { name: 'Alice', city: 'NY' } },
  { id: '2', path: 'c/2', data: { name: 'Bob, Jr', ref: { _ref: 'users/9' } } },
];

describe('toJson', () => {
  it('round-trips the full record shape', () => {
    expect(JSON.parse(toJson(records))).toEqual(records);
  });
});

describe('toCsv', () => {
  it('builds a header from the union of fields', () => {
    expect(toCsv(records).split('\n')[0]).toBe('id,name,city,ref');
  });

  it('quotes cells containing commas and renders reference markers', () => {
    const lines = toCsv(records).split('\n');
    expect(lines[2]).toBe('2,"Bob, Jr",,→ users/9');
  });

  it('leaves missing fields blank', () => {
    expect(toCsv(records).split('\n')[1]).toBe('1,Alice,NY,');
  });
});
