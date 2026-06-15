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
- Package manager: **pnpm**.

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

## Testing

`vitest` with `happy-dom`. Tests sit next to the code as `*.test.ts`. Favour
testing pure functions. Run `pnpm test` (and `pnpm typecheck`) before committing.
