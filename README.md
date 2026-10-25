<h1 align="center">Firestore IDE</h1>

<p align="center">
  A free, open-source desktop IDE for Google Cloud Firestore.<br/>
  Browse, edit, and query your data — powered by AI.
</p>

<p align="center">
  <a href="https://github.com/alwatroos/firestore-ide/releases/latest">
    <img alt="Latest release" src="https://img.shields.io/github/v/release/alwatroos/firestore-ide?style=flat-square&color=blue"/>
  </a>
  <a href="https://github.com/alwatroos/firestore-ide/blob/main/LICENSE">
    <img alt="MIT license" src="https://img.shields.io/badge/license-MIT-green?style=flat-square"/>
  </a>
  <a href="https://github.com/alwatroos/firestore-ide/actions">
    <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/alwatroos/firestore-ide/ci.yml?style=flat-square&label=CI"/>
  </a>
</p>

---

<!-- Replace the placeholder below with an actual screenshot once available. -->
<!-- ![Firestore IDE screenshot](docs/screenshot.png) -->

## Why Firestore IDE?

Firestore's web console is great for quick lookups, but it struggles with large collections, complex queries, and day-to-day developer workflows. Firestore IDE gives you a native, keyboard-friendly desktop experience with the one extra power-up the console will never have: **just describe what you want in plain English and let the AI write the query**.

## Features

- **Multiple connections** — manage any number of Firebase / GCP projects, each authenticated with a service account key. Keys are encrypted at rest using the OS keychain (Electron `safeStorage`).
- **Collection browser** — navigate collections and sub-collections in a table view with sortable columns derived from the actual schema.
- **Document editor** — open any document as formatted JSON, make edits inline, create new documents, or delete them.
- **AI query generation** — powered by a locally-running [Ollama](https://ollama.com/) model. The AI is grounded in the inferred schema of your connected database, so it generates queries that match your real data shape.
- **Security-first** — all Firestore and Ollama network calls happen in the Electron main process. The renderer UI never touches your credentials or raw data.
- **Cross-platform** — runs on macOS, Windows, and Linux.

## Download

Pre-built installers are attached to every [GitHub Release](https://github.com/alwatroos/firestore-ide/releases):

| Platform | Installer |
| --- | --- |
| macOS | `.dmg` |
| Windows | `.exe` |
| Linux | `.AppImage` |

> **Note:** macOS builds are signed and notarised when the Apple signing secrets are configured for the release, and unsigned otherwise. An unsigned build makes macOS warn you on first launch — right-click the app and choose **Open** to bypass Gatekeeper.

## Getting started (from source)

### Prerequisites

- Node.js 22+
- [Corepack](https://nodejs.org/api/corepack.html) (ships with Node.js)
- A running [Ollama](https://ollama.com/) instance with at least one model pulled, e.g. `ollama pull llama3.1`
- A Firebase / GCP **service account key** (JSON) for each project you want to connect

### Run in development

```bash
corepack enable        # activates the correct pnpm version
pnpm install
pnpm dev
```

### Build a local installer

```bash
pnpm dist              # outputs an installer into dist/
```

## Usage

1. **Add a connection** — click the **+** button in the sidebar and select your service account JSON file.
2. **Browse collections** — pick a collection from the tree; documents appear in the table on the right.
3. **Edit a document** — click any row to open the JSON editor. Changes are saved back to Firestore on confirm.
4. **AI query** — open the AI panel at the bottom, type what you're looking for in plain language, and hit **Generate**. The model writes a Firestore query based on your schema and runs it automatically.

## Contributing

Contributions are welcome! Please open an issue before starting significant work so we can align on the approach.

```bash
pnpm typecheck         # type-check both the main and renderer graphs
pnpm test              # run unit tests
```

Commits must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, …) — enforced by the `commit-msg` git hook.

See [CLAUDE.md](./CLAUDE.md) for a full architecture overview and contribution conventions.

## Support the project

Firestore IDE is and will always be **free and open-source**. If it saves you time and you'd like to support continued development, you can sponsor the project on GitHub:

**[❤️ Sponsor on GitHub](https://github.com/sponsors/alwatroos)**

Every contribution — no matter the size — helps keep the project going. Thank you!

## License

[MIT](./LICENSE) © Karol Płoski
