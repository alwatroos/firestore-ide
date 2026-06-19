import type { CollectionSchema, DatabaseSchema, FieldSchema } from '@shared/types/schema';
import { markerKind } from '@shared/utils/markers';
import { requireConnection } from '../connections/store';
import { listCollections, listDocuments } from './service';

/**
 * Classify a plain value into a coarse schema type label.
 *
 * @param value - The value to classify.
 * @returns A type label such as `string`, `array`, `timestamp` or `reference`.
 */
export function valueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const kind = markerKind(value);
  if (kind) return kind;
  return typeof value;
}

/**
 * Accumulate field type information from a single document into the map.
 *
 * @param sample - One document's data.
 * @param acc - Mutable accumulator keyed by field name.
 * @returns Nothing; mutates `acc`.
 */
function collectFields(
  sample: Record<string, unknown>,
  acc: Map<string, { types: Set<string>; occurrences: number }>
): void {
  for (const [key, value] of Object.entries(sample)) {
    const entry = acc.get(key) ?? { types: new Set<string>(), occurrences: 0 };
    entry.types.add(valueType(value));
    entry.occurrences += 1;
    acc.set(key, entry);
  }
}

/**
 * Infer field schemas from a set of sampled documents.
 *
 * @param samples - Document data objects to analyse.
 * @returns One {@link FieldSchema} per observed field.
 */
export function inferFields(samples: Record<string, unknown>[]): FieldSchema[] {
  const acc = new Map<string, { types: Set<string>; occurrences: number }>();
  for (const sample of samples) collectFields(sample, acc);
  return [...acc].map(([name, info]) => ({
    name,
    types: [...info.types],
    occurrences: info.occurrences,
  }));
}

/**
 * Infer the schema of a single collection from a bounded document sample.
 *
 * @param connectionId - Target connection.
 * @param path - Collection path.
 * @param sampleSize - Maximum documents to sample.
 * @returns The inferred collection schema.
 */
async function inferCollectionSchema(
  connectionId: string,
  path: string,
  sampleSize: number
): Promise<CollectionSchema> {
  const docs = await listDocuments(connectionId, path, sampleSize);
  return { path, sampleSize: docs.length, fields: inferFields(docs.map((d) => d.data)) };
}

/**
 * Build an AI-ready schema snapshot across all root collections.
 *
 * @param connectionId - Target connection.
 * @param sampleSize - Documents sampled per collection.
 * @returns The aggregate database schema.
 */
export async function inferSchema(
  connectionId: string,
  sampleSize: number
): Promise<DatabaseSchema> {
  const { projectId } = await requireConnection(connectionId);
  const names = await listCollections(connectionId);
  const collections = await Promise.all(
    names.map((name) => inferCollectionSchema(connectionId, name, sampleSize))
  );
  return { projectId, collections };
}
