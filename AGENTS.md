# Combined queue recovery archive

This branch is `queued/acquired-selected-episodes`, an archived combined source, not a publication branch. Its original delivery instructions below are historical. Never merge this entire branch into main or use its combined catalog for publication.

The current workflow and registry are on `codex/recover-acquired-queue`, based on shared workflow commit `28cb451`. Before creating or publishing another artifact, fetch that branch and the `queue/acquired/*` refs and follow its `docs/publishing.md` and `docs/acquired/authoring.md`. The handoff in `docs/acquired-queue-handoff.md` gives exact recovery commands and prerequisites. Future companions use one `queue/acquired/<id>` branch, self-contained bundles and `docs/evidence/acquired/<id>.md` maps.

Canonical authoring state: `content/acquired-artifact-queue.json` on the registry handoff branch. The original `.codex/acquired-artifact-queue.json`, reviewed source commits and legacy files remain here for recovery. No main push, merge or deployment is authorized by this archive.

---

# Artifact delivery workflow

When the user asks to create an artifact or supplies an Acquired transcript, create the standalone illustrated HTML companion in this repository. Follow README.md and docs/acquired-artifacts.md. Register it in content/library.json, build, test, and inspect desktop and mobile rendering. Commit and push the complete source and assets to the established remote branch, then deploy through the existing hosting workflow and verify the live URL. Do not substitute a ChatGPT Page or treat a local build as delivery. No additional delivery confirmation is needed for this established workflow unless a tool requires approval. Preserve the existing site's audience. Report any concrete blocker honestly.

Read repository and hosting configuration before choosing a destination. Prefer /workspace/library over the older /workspace/acquired checkout for the shared Library. User instructions can override this default.

Hosting is GitHub → Vercel: push the agreed changes to `main` at `https://github.com/jjhuang22/library`; the existing Vercel integration builds and deploys the site. Use `npm run build` and the `dist/` output. Do not use ChatGPT Sites or create another hosting project. Check the pushed commit's Vercel deployment status when available.
