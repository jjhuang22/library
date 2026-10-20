# Library

A static reading library for podcast episodes, books, and standalone illustrated companions. Inspired by [Boris Cherny’s artifact](https://claude.ai/artifact/RdE6uE7WozcP2MLfx3BDky).

`content/library.json` describes the artifacts present in a branch. On main it is the published catalog; on a queue branch it includes that branch's one additional artifact. `content/queue.json` locates prepared episodes and records whether their source review is complete. Empty collections stay hidden.

## Development

Requires Node.js 22 or newer. No framework or build dependencies are required.

```sh
npm run dev         # Build and serve locally on port 3000
npm run build       # Generate dist/
npm test            # Build and selective-publication tests
npm run queue:list  # List queued episodes and review status
```

The home page sorts by original creation date. Acquired seasons use the library's Spring/Fall convention, derived from release date. Artifact links open standalone pages; their Home link returns to `/`.

## Repository structure

- `AGENTS.md`: entry instructions for agents, including natural-language create and publish requests.
- `docs/publishing.md`: general queue and publishing workflow for every collection.
- `docs/acquired/authoring.md`: Acquired transcript, narrative, illustration, and navigation requirements.
- `docs/evidence/<collection>/<id>.md`: permanent source maps; not deployed.
- `docs/queue.md`: queue migration inventory and outstanding source reviews.
- `content/library.json`: catalog entries with `id`, `title`, `category`, `addedOn`, `file`, and, for Acquired, `releasedOn`.
- `content/queue.json`: episode branch registry and source-review status; not deployed.
- `public/index.html`, `app.js`, `styles.css`: the library interface.
- `public/artifacts/<collection>/<id>/index.html` and `images/`: each artifact's deployable bundle.
- `public/assets/acquired/`: shared Acquired typography, timelines, and navigation themes.
- `public/fonts/`: bundled fonts and licenses.
- `scripts/`: build, preview server, and selective-publication tooling.
- `tests/`: automated checks. `dist/` is generated and ignored by Git.

The build deploys catalog-listed artifact bundles only. Reader routes remain `/<collection>/<id>/`. Legacy `/artifacts/<collection>/<id>.html` links are generated as compatibility copies. Source maps, queue metadata, and unlisted artifact bundles stay out of dist.

## Create and publish

Creating an artifact defaults to saving it on `queue/<collection>/<id>`, without publishing it. Start with the [publishing workflow](docs/publishing.md); Acquired content additionally follows the [authoring guide](docs/acquired/authoring.md).

“Publish Vanguard” means publish that episode alone in one commit, after validation. The tool prepares an isolated worktree from current main so it preserves other publications even when a queue branch is older:

```sh
npm run artifact:publish -- acquired/vanguard --prepare
# Inspect desktop and mobile rendering in the printed worktree.
npm run artifact:publish -- acquired/vanguard --push
```

Hosting uses the existing GitHub → Vercel integration. Main deploys with `npm run build`, output `dist/`. See the workflow for source-review gates, failure recovery, and deployment verification.
