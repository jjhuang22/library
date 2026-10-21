# Library

A static reading library for podcast episodes, books, and illustrated companions. Inspired by [Boris Cherny’s artifact](https://claude.ai/artifact/RdE6uE7WozcP2MLfx3BDky).

Main contains the published library. Unpublished artifacts live on individual `queue/<collection>/<id>` branches until the user requests publication, usually after listening or reading. The scheduled automation keeps its creation backlog in its own instructions; there is no tracked queue registry.

## Development

Requires Node.js 22 or newer. No framework or build dependencies are required.

```sh
npm run dev             # Build and serve locally on port 3000
npm run build           # Generate dist/
npm test                # Build, source-map and publication checks
npm run queue:list      # Fetch and list unpublished remote branches and readiness
npm run evidence:check  # Check maps against this branch's catalog
```

The home page sorts by original creation date. Empty collections stay hidden. Reader routes are `/<collection>/<id>/`; legacy `/artifacts/<collection>/<id>.html` links are generated as compatibility copies. Only catalog-listed bundles enter the build. Artifact pages are standalone and link Home to `/`.

## Repository structure

- `AGENTS.md`: brief agent entry instructions and interpretation of create/publish requests.
- `docs/publishing.md`: shared creation, review and selective publication workflow.
- `docs/collections/<collection>.md`: source-specific authoring requirements, beginning with [Acquired](docs/collections/acquired.md).
- `docs/evidence/<collection>/<id>.md`: source passages, qualifications, timing provenance and, for queued work, a review record. Maps travel with their artifact and are never deployed.
- `content/library.json`: this branch's catalog. Main lists published artifacts; a queue branch adds its one artifact. Entries retain `id`, `title`, `category`, `addedOn`, `file`, and collection-specific metadata such as Acquired's `releasedOn`.
- `public/index.html`, `app.js`, `styles.css`: the library interface.
- `public/artifacts/<collection>/<id>/index.html` and `images/`: each deployable bundle and its artwork.
- `public/assets/<collection>/`: reusable collection styles and navigation; `public/fonts/` contains bundled fonts and licenses.
- `scripts/` and `tests/`: build, preview, evidence and selective publication tools. Generated `dist/` is ignored by Git.

Shared procedures live directly under `docs/`; collection guides and per-artifact evidence have distinct subdirectories. Add guides and assets when a new collection needs them, rather than creating empty directories in advance.

## Create and publish

Follow [the workflow](docs/publishing.md). “Publish Vanguard” authorizes these steps, including verification and the final push:

```sh
npm run artifact:publish -- acquired/vanguard --prepare
# Browser-check the printed worktree at desktop, 390px and 320px widths.
npm run artifact:publish -- acquired/vanguard --push
```

Publication starts from current main and copies only the selected artifact, its source map and catalog entry into one commit. The existing GitHub → Vercel integration deploys main with `npm run build`, output `dist/`.
