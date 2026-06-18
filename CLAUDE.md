# CLAUDE.md

Guidance for working in this repository.

## What this is

A cross-platform **desktop IDE for Google Cloud Firestore**, built with Electron
+ React 19 + TypeScript. It supports multiple project connections, readable data
browsing, easy document editing, and **natural-language query generation via
Ollama**, grounded in the connected database's inferred schema.

## Tech stack

- **Electron 42** (main + preload + renderer), ESM throughout (`"type": "module"`).
- **electron-vite 5** for dev/build. Vite is pinned to **7.x** because
  `electron-vite@5` does not yet support Vite 8. `@vitejs/plugin-react` is pinned
  to **5.x** for the same reason (v6 requires Vite 8). When bumping Vite, bump
  these together.
- **React 19** + **jotai 2** for state management.
- **firebase-admin 14** (modular API: `firebase-admin/app`, `firebase-admin/firestore`).
- **ollama** client for model listing and JSON-constrained chat completion.
- **Tailwind CSS 4** via `@tailwindcss/vite`.
- **vitest 4** + **happy-dom** for unit tests.
- Package manager: **pnpm**, pinned via the `packageManager` field and activated
  with **Corepack** (`corepack enable`). CI uses Corepack rather than a separate
  pnpm install action.
- **husky 9** git hooks; a `commit-msg` hook enforces Conventional Commits.

## Commands

```bash
pnpm install        # install deps (runs approved build scripts)
pnpm dev            # run the app in development (Vite + Electron)
pnpm build          # type-aware production build into out/
pnpm dist           # build + package installers via electron-builder
pnpm typecheck      # tsc for both the node and web project graphs
pnpm test           # run vitest once
pnpm test:watch     # watch mode
pnpm test:coverage  # coverage report
```

## Architecture

Three Electron layers; **all Firestore, Ollama and credential access lives in the
main process**. The renderer talks to it only through a typed, sanitised IPC
bridge — it never imports Node, Electron, firebase-admin, or any secret.

```
src/
  shared/                 # types + IPC contract shared by all layers
    types/                # ConnectionMeta, DocumentRecord, QuerySpec, AppSettings…
    ipc/channels.ts       # single source of truth for channel names
    utils/result.ts       # ok/err/toMessage helpers
  main/                   # Node side — grouped by domain
    core/                 # jsonFile, paths, ipc (Result-wrapping handler)
    connections/          # crypto (safeStorage), store, service, serialize, ipc
    firestore/            # clientManager, service, queryBuilder, mapper, schema, ipc
    ollama/               # client, prompt, service, ipc
    settings/             # store, ipc
  preload/index.ts        # contextBridge → window.api (FirestoreIdeApi)
  renderer/src/           # React app — grouped by domain
    domains/{connections,explorer,documents,ai,settings}/  # atoms + hooks + components
    components/           # shared UI (Sidebar, ui primitives)
    lib/                  # api wrapper, useAsync, json parsing
```

### IPC contract

Every renderer call goes through `window.api` (typed by
`FirestoreIdeApi` in `src/shared/types/api.ts`). Each handler returns a
`Result<T>` (`{ ok, data } | { ok, error }`) so raw `Error` objects — and any
stack traces or secrets — never cross the process boundary. Add a channel by:
1. adding the name to `src/shared/ipc/channels.ts`,
2. adding the method to `FirestoreIdeApi`,
3. wiring it in the preload and in the relevant `*/ipc.ts` via `handle(...)`.

## Security model (review on every change)

- Service account keys are encrypted at rest with Electron `safeStorage`
  (OS keychain) and stored in `userData/connections.json`. Plaintext keys are
  never persisted nor sent back to the renderer.
- `ConnectionMeta` (the only connection shape exposed to the renderer) is
  produced by `toMeta`, which strips `encryptedCredentials`. Keep it that way.
- The renderer runs with `contextIsolation: true`, `nodeIntegration: false`,
  and a strict CSP in `index.html`.
- Firestore/Ollama network calls happen only in the main process.

## Conventions

- **TypeScript everywhere.** `verbatimModuleSyntax` is on — use `import type`
  for type-only imports.
- **Group code by domain**, not by technical layer.
- **Small functions** (~15 lines max) with **JSDoc** on every function,
  including `@param` / `@returns` / `@throws`.
- **State management is jotai.** Atoms live in `domains/<d>/atoms.ts`; data
  fetching/mutations live in `domains/<d>/hooks.ts` and use the shared
  `useAsync` helper for busy/error state.
- Avoid deep nesting; prefer early returns and small helpers.
- Pure logic (mappers, schema inference, prompt building, parsers, column
  derivation) is isolated and unit-tested; UI side effects are kept thin.
- **No SSR.** The Electron renderer is a client-only SPA, so the SSR/hydration
  guidance does not apply here; component splitting and jotai hydration-friendly
  atoms are still used.

## Git hooks (husky)

`pnpm install` runs `prepare` → `husky`, installing hooks from `.husky/`. The
`commit-msg` hook runs `scripts/verify-commit-msg.mjs`, which rejects any commit
whose subject is not a Conventional Commit (`feat`, `fix`, `chore`, `docs`,
`style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`), e.g.
`feat(explorer): add filtering`. Merge/revert/fixup commits are exempt. Bypass in
emergencies with `git commit --no-verify`.

## Testing

`vitest` with `happy-dom`. Tests sit next to the code as `*.test.ts`. Favour
testing pure functions. Run `pnpm test` (and `pnpm typecheck`) before committing.

## Releases (CI/CD)

Releases are **manual only** — triggered by a human from the GitHub Actions UI.
There are two paths, both of which end with a tag, a GitHub Release, and built
installers (`.AppImage` / `.exe` / `.dmg`) attached to the release.

### Branch model

```
develop  ──────────────────────────────────────────────►
              │                                 ▲
              └─ RELEASE/X.Y.0 ──► main ────────┘  (back-merge)
main     ──────────────────────────────────────────────►
              ▲                        │ ▲
              │  HOTFIX/X.Y.Z ─────────┘ │
              └───────────────────────────┘  (back-merge to develop)
```

### Regular release (`release-regular.yml`) — minor bump

Trigger: **Actions → "Release – Regular (minor bump)" → Run workflow**

1. Checks out `develop`.
2. Bumps the **minor** version (`X.Y.Z → X.(Y+1).0`) in `package.json`.
3. Creates `RELEASE/X.(Y+1).0` from `develop`, commits the bump, pushes.
4. Merges `RELEASE/…` into `main` using a merge commit (no squash/rebase).
5. Tags `vX.(Y+1).0` on `main` and pushes the tag.
6. Back-merges `main` into `develop` so the version bump propagates.
7. Deletes the `RELEASE/…` branch.
8. Creates a GitHub Release with auto-generated notes.
9. **Build** job (matrix: ubuntu / windows / macos) runs `pnpm dist` and
   attaches installers to the release.

### Fix release (`release-fix.yml` + `release-hotfix-merge.yml`) — patch bump

**Step 1 — create the hotfix branch:**
Trigger: **Actions → "Release – Fix (patch bump) – Create Hotfix" → Run workflow**

1. Bumps the **patch** version (`X.Y.Z → X.Y.(Z+1)`) in `package.json` on `main`.
2. Creates `HOTFIX/X.Y.(Z+1)` from `main`, commits the bump, pushes.
3. Opens a PR `HOTFIX/… → main` automatically.

**Step 2 — apply the fix and release:**

4. Developer pushes fix commits onto the `HOTFIX/…` branch.
5. Developer clicks **"Merge pull request"** on GitHub.
6. `release-hotfix-merge.yml` fires automatically:
   - Tags `vX.Y.(Z+1)` on `main`.
   - Back-merges `main` into `develop`.
   - Deletes the `HOTFIX/…` branch.
   - Creates a GitHub Release with auto-generated notes.
   - **Build** job builds and attaches installers.

### Notes

- Builds are **unsigned** (`CSC_IDENTITY_AUTO_DISCOVERY=false`); add signing
  secrets and config when distribution requires it.
- electron-builder runs with `publish: null`; release assets are uploaded by the
  workflow (`softprops/action-gh-release`), not by electron-builder.
- The bot pushes directly to `main` and `develop` via `GITHUB_TOKEN`. If those
  branches have push-protection rules, either disable them for the Actions bot or
  replace `secrets.GITHUB_TOKEN` with a PAT stored in `secrets.BOT_TOKEN`.
- Back-merge steps will fail if `main` and `develop` have diverged with conflicts;
  resolve manually and re-run the failed job.
