import { GeoPoint, Timestamp } from 'firebase-admin/firestore'
import { describe, expect, it } from 'vitest'
import { toPlain, toPlainData } from './mapper'

describe('toPlain', () => {
  it('converts a Timestamp to an ISO string', () => {
    const date = new Date('2020-01-01T00:00:00.000Z')
    expect(toPlain(Timestamp.fromDate(date))).toBe(date.toISOString())
  })

  it('converts a GeoPoint to a tagged tuple', () => {
    expect(toPlain(new GeoPoint(1, 2))).toEqual({ _geopoint: [1, 2] })
  })

  it('recurses through arrays and nested objects', () => {
    expect(toPlainData({ a: [1, { b: 'x' }] })).toEqual({ a: [1, { b: 'x' }] })
  })
})
