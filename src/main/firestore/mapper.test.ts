import { type DocumentReference, GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import { fromPlain, fromPlainData, toPlain, toPlainData } from './mapper';

describe('toPlain', () => {
  it('converts a Timestamp to a tagged ISO marker', () => {
    const date = new Date('2020-01-01T00:00:00.000Z');
    expect(toPlain(Timestamp.fromDate(date))).toEqual({ _timestamp: date.toISOString() });
  });

  it('converts a GeoPoint to a tagged tuple', () => {
    expect(toPlain(new GeoPoint(1, 2))).toEqual({ _geopoint: [1, 2] });
  });

  it('converts Bytes to a base64 marker', () => {
    expect(toPlain(Buffer.from('hi'))).toEqual({ _bytes: Buffer.from('hi').toString('base64') });
  });

  it('recurses through arrays and nested objects', () => {
    expect(toPlainData({ a: [1, { b: 'x' }] })).toEqual({ a: [1, { b: 'x' }] });
  });
});

/** Minimal Firestore stub exposing only `doc` for reference revival. */
const dbStub = { doc: (path: string) => ({ path }) as unknown as DocumentReference } as never;

describe('fromPlain', () => {
  it('revives a timestamp marker into a Timestamp', () => {
    const iso = '2020-01-01T00:00:00.000Z';
    const revived = fromPlain({ _timestamp: iso }, dbStub);
    expect(revived).toBeInstanceOf(Timestamp);
    expect((revived as Timestamp).toDate().toISOString()).toBe(iso);
  });

  it('revives a geopoint marker into a GeoPoint', () => {
    const revived = fromPlain({ _geopoint: [1, 2] }, dbStub);
    expect(revived).toBeInstanceOf(GeoPoint);
  });

  it('revives a bytes marker into a Buffer', () => {
    const revived = fromPlain({ _bytes: Buffer.from('hi').toString('base64') }, dbStub);
    expect(Buffer.isBuffer(revived)).toBe(true);
    expect((revived as Buffer).toString()).toBe('hi');
  });

  it('revives a reference marker via db.doc', () => {
    expect(fromPlain({ _ref: 'users/1' }, dbStub)).toEqual({ path: 'users/1' });
  });

  it('leaves ordinary objects and nested values intact', () => {
    expect(fromPlainData({ a: [1, { b: 'x' }] }, dbStub)).toEqual({ a: [1, { b: 'x' }] });
  });

  it('round-trips a GeoPoint through toPlain → fromPlain', () => {
    const revived = fromPlain(toPlain(new GeoPoint(3, 4)), dbStub);
    expect(revived).toBeInstanceOf(GeoPoint);
    expect((revived as GeoPoint).latitude).toBe(3);
  });

  it('throws on an invalid timestamp marker', () => {
    expect(() => fromPlain({ _timestamp: 'not-a-date' }, dbStub)).toThrow(/Invalid _timestamp/);
  });

  it('does not treat multi-key objects as markers', () => {
    expect(fromPlain({ _ref: 'users/1', extra: true }, dbStub)).toEqual({
      _ref: 'users/1',
      extra: true,
    });
  });
});
