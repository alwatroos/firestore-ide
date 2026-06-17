import { COUNT_SENTINEL_ID, type DocumentRecord } from '@shared/types/firestore'

/** Running tally of estimated Firestore operations for the current session. */
export interface CostTotals {
  /** Estimated document reads. */
  reads: number
  /** Document writes (creates/updates). */
  writes: number
  /** Document deletes. */
  deletes: number
}

/** A zeroed cost tally. */
export const ZERO_COST: CostTotals = { reads: 0, writes: 0, deletes: 0 }

/**
 * Estimate the document reads billed for a query result. Firestore bills one
 * read per returned document (minimum one), and an aggregation counts as a
 * single read in this approximation.
 *
 * @param results - The documents returned by the query.
 * @returns The estimated number of reads.
 */
export function estimateReads(results: DocumentRecord[]): number {
  if (results.length === 1 && results[0].id === COUNT_SENTINEL_ID) return 1
  return Math.max(1, results.length)
}

/**
 * Add a delta to a running cost tally, returning a new total.
 *
 * @param totals - The current totals.
 * @param delta - The operations to add (any subset of reads/writes/deletes).
 * @returns The combined totals.
 */
export function addCost(totals: CostTotals, delta: Partial<CostTotals>): CostTotals {
  return {
    reads: totals.reads + (delta.reads ?? 0),
    writes: totals.writes + (delta.writes ?? 0),
    deletes: totals.deletes + (delta.deletes ?? 0),
  }
}
