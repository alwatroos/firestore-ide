import type { SecurityRules } from '@shared/types/rules'
import { requireConnection } from '../connections/store'
import { getAccessToken } from '../firestore/clientManager'

/** Base URL of the Firebase Security Rules REST API. */
const RULES_API = 'https://firebaserules.googleapis.com/v1'

/**
 * Turn a failed Rules API response into a helpful error message.
 *
 * @param response - The non-OK fetch response.
 * @returns A descriptive Error.
 */
async function apiError(response: Response): Promise<Error> {
  if (response.status === 403) {
    return new Error(
      'Permission denied: the service account needs the "Firebase Rules Viewer" role to read Security Rules.'
    )
  }
  if (response.status === 404) {
    return new Error('No active Firestore Security Rules release was found for this project.')
  }
  const body = await response.text().catch(() => '')
  return new Error(`Rules API error ${response.status}: ${body.slice(0, 200)}`)
}

/**
 * Fetch the active Firestore Security Rules for a connection's project via the
 * Firebase Rules REST API. Read-only; no simulation.
 *
 * @param connectionId - Target connection.
 * @returns The concatenated rules source and the backing ruleset name.
 * @throws If the request fails or permission is denied.
 */
export async function getActiveRules(connectionId: string): Promise<SecurityRules> {
  const { projectId } = await requireConnection(connectionId)
  const token = await getAccessToken(connectionId)
  const headers = { Authorization: `Bearer ${token}` }

  const releaseRes = await fetch(`${RULES_API}/projects/${projectId}/releases/cloud.firestore`, {
    headers,
  })
  if (!releaseRes.ok) throw await apiError(releaseRes)
  const release = (await releaseRes.json()) as { rulesetName?: string }
  if (!release.rulesetName) throw new Error('Active release did not reference a ruleset.')

  const rulesetRes = await fetch(`${RULES_API}/${release.rulesetName}`, { headers })
  if (!rulesetRes.ok) throw await apiError(rulesetRes)
  const ruleset = (await rulesetRes.json()) as { source?: { files?: { content: string }[] } }
  const source = (ruleset.source?.files ?? []).map((file) => file.content).join('\n')
  return { source, rulesetName: release.rulesetName }
}
