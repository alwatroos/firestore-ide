# Firestore IDE

A cross-platform desktop IDE for Google Cloud Firestore, powered by Electron,
React 19 and TypeScript — with natural-language query generation via Ollama.

## Features

- 🔌 **Multiple connections** to multiple Firebase/GCP projects, each imported
  from a service account key and encrypted at rest with the OS keychain.
- 📚 **Readable browsing** of collections and documents in a table view.
- ✏️ **Easy editing** of documents as formatted JSON, with create and delete.
- 🤖 **AI query generation** with Ollama: describe what you want in plain
  language and the selected model writes a Firestore query, grounded in your
  database's inferred schema, then runs it.
- 🔒 **Security-first**: credentials and all Firestore/Ollama access stay in the
  Electron main process; the renderer only ever sees sanitised data.

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/)
- A running [Ollama](https://ollama.com/) instance (defaults to
  `http://localhost:11434`, configurable in Settings) with at least one model
  pulled, e.g. `ollama pull llama3.1`.
- A Firebase/GCP **service account key** (JSON) for each project.

## Getting started

```bash
pnpm install
pnpm dev
```

Add a connection from the sidebar by selecting your service account JSON file,
pick a collection to browse documents, click a row to edit it, or use the AI
panel at the bottom to generate and run a query.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run the app in development. |
| `pnpm build` | Production build into `out/`. |
| `pnpm dist` | Build and package installers. |
| `pnpm typecheck` | Type-check the node and web graphs. |
| `pnpm test` | Run unit tests. |

See [CLAUDE.md](./CLAUDE.md) for architecture and contribution conventions.

## License

MIT
