import { getDb } from './clientManager'

/**
 * Verify a connection can reach Firestore by issuing a lightweight read.
 *
 * @param connectionId - Connection to verify.
 * @returns `true` when Firestore responds successfully.
 */
export async function testConnection(connectionId: string): Promise<boolean> {
  const db = await getDb(connectionId)
  await db.listCollections()
  return true
}
