import { notarize } from '@electron/notarize';

/**
 * afterSign hook called by electron-builder for macOS builds.
 * Submits the signed .app to Apple's notarytool for notarization.
 * Skips silently when Apple credentials are not provided (e.g. local dev builds).
 *
 * Required env vars (set as GitHub Actions secrets):
 *   APPLE_ID          — Apple ID email used for notarization
 *   APPLE_ID_PASS     — App-specific password for that Apple ID
 *   APPLE_TEAM_ID     — 10-character Apple Developer Team ID
 *
 * @param {import('electron-builder').AfterPackContext} context
 */
export default async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') return;

  const { APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD: APPLE_ID_PASS, APPLE_TEAM_ID, CSC_LINK } = process.env;

  // Notarization requires a proper Developer ID signature. Skip if any
  // credential is missing — unsigned/ad-hoc builds cannot be notarized.
  if (!CSC_LINK || !APPLE_ID || !APPLE_ID_PASS || !APPLE_TEAM_ID) {
    console.log('Skipping notarization — signing credentials not fully set.');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`Notarizing ${appPath}…`);

  await notarize({
    tool: 'notarytool',
    appPath,
    appleId: APPLE_ID,
    appleIdPassword: APPLE_ID_PASS,
    teamId: APPLE_TEAM_ID,
  });

  console.log('Notarization complete.');
}
