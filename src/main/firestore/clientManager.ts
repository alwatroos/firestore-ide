import { cert, deleteApp, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getCredentials } from '../connections/service'

/** Cache of initialised Firebase apps keyed by connection id. */
const apps = new Map<string, App>()

/**
 * Get (or lazily create) the Firebase app for a connection.
 *
 * @param connectionId - Connection whose credentials initialise the app.
 * @returns The initialised Firebase app.
 */
async function getApp(connectionId: string): Promise<App> {
  const existing = apps.get(connectionId)
  if (existing) return existing
  const account = await getCredentials(connectionId)
  const credential = cert({
    projectId: account.project_id,
    clientEmail: account.client_email,
    privateKey: account.private_key
  })
  const app = initializeApp({ credential }, connectionId)
  apps.set(connectionId, app)
  return app
}

/**
 * Resolve the Firestore instance for a connection.
 *
 * @param connectionId - Connection id.
 * @returns A ready-to-use Firestore client.
 */
export async function getDb(connectionId: string): Promise<Firestore> {
  return getFirestore(await getApp(connectionId))
}

/**
 * Mint an OAuth2 access token for a connection's service account. The admin
 * credential's scopes include `cloud-platform`, covering the Rules API.
 *
 * @param connectionId - Connection id.
 * @returns A bearer access token string.
 * @throws If the app has no usable credential.
 */
export async function getAccessToken(connectionId: string): Promise<string> {
  const app = await getApp(connectionId)
  const credential = app.options.credential
  if (!credential) throw new Error('No credential available for this connection')
  const token = await credential.getAccessToken()
  return token.access_token
}

/**
 * Dispose the Firebase app for a connection, releasing its resources.
 *
 * @param connectionId - Connection id whose app should be torn down.
 * @returns Resolves once the app is deleted.
 */
export async function disposeClient(connectionId: string): Promise<void> {
  const app = apps.get(connectionId)
  if (app) await deleteApp(app)
  apps.delete(connectionId)
}
