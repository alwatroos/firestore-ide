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

Releases are **owner-run** from the GitHub Actions UI. A release is a `vX.Y.Z` tag on `main`, a GitHub
Release, and installers (`.AppImage` / `.exe` / `.dmg`) built by `release.yml`.

### Branch model

Work happens on `develop` and reaches `main` through a pull request. The version in `package.json` is
bumped in that PR; the release tag must match it.

### Steps

1. Merge the `develop` → `main` PR (with the version bump in `package.json`).
2. Wait for the CI **push** run on `main` to go green (`ci.yml` runs on pushes to `main`).
3. Actions → **Release** → Run workflow on `main` (a dry run: builds unsigned installers on all three OSes).
4. Actions → **Tag release** → Run workflow on `main` with `version` (`X.Y.Z`, no `v`), `sha` (empty means the head
   of `main`) and `confirm` = `release vX.Y.Z`.
5. Tag release validates, creates the tag through the API and dispatches `release.yml` on the tag. That run
   builds, signs macOS, and creates the GitHub Release.

`tag-release-validate.sh` fails closed unless: it runs on `main`; the version is semver and equals `package.json`
at the commit; the commit is on `main`; the tag does not exist; `release.yml` at the commit has the
`# tag-dispatch:` marker; the latest Release dry run on `main` and a CI push run on `main` both succeeded for
exactly that commit. Scripts live in `.github/scripts/` and are tested offline in the CI job `Release scripts`.

### What publishes

Only a `v*` tag run (or a `workflow_dispatch` on a `refs/tags/v*` ref) publishes. Pull-request and branch runs
build unsigned installers and publish nothing. The `host` job creates the Release with `gh release create
--generate-notes`; a tag containing `-` (e.g. `v1.2.0-rc.1`) is marked as a pre-release. electron-builder runs
with `publish: null`.

### macOS signing and notarisation

On a publishing run the `sign-macos` job (environment `release`) rebuilds the dmg with `pnpm dist` using
electron-builder's own signing (`CSC_LINK`, `CSC_KEY_PASSWORD`) and API-key notarisation, via
`.github/scripts/sign-macos.sh`, then replaces the unsigned macOS artifact. If the signing secrets are missing,
a notice is shown and macOS ships unsigned. If they are set and signing or notarisation fails, the job fails,
unless the repository variable `SQLER_ALLOW_UNSIGNED_FALLBACK` is `true` (then the unsigned build ships with a
warning).

### Required configuration

- Environment `release` (ideally restricted to tags `v*`).
- Secrets: `APPLE_CERTIFICATE` (base64 .p12), `APPLE_CERTIFICATE_PASSWORD`, `APPLE_API_KEY` (base64 .p8),
  `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`.
- Repository variable `SQLER_ALLOW_UNSIGNED_FALLBACK` (optional).
- The `SQLER_*` name is kept from the sqler repository on purpose, so both repos share one convention.
