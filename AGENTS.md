# Library agent instructions

Read [README.md](README.md) for repository structure and commands, then [docs/publishing.md](docs/publishing.md) before creating or publishing artifacts. Follow the linked collection guide for source, narrative and presentation rules.

- Creation defaults to one saved `queue/<collection>/<id>` branch. Keep its bundle, catalog entry, evidence and review record together. The scheduled automation owns the creation backlog; creating an artifact makes no main commit.
- Publish only when the user explicitly requests it, generally after listening or reading. “Publish [episode]” authorizes the complete selective workflow: resolve its branch, prepare, validate, browser-check, make one commit, push main, and verify deployment. Ask only if the requested episode is ambiguous. Never merge an entire queue branch into main.
- Keep evidence at `docs/evidence/<collection>/<id>.md` with the corresponding artifact. Main contains published maps only. Run `npm run evidence:check`. Store temporary locks, source copies and execution logs outside tracked files.
- Preserve other artifacts, first publication dates (`addedOn`, displayed as Created), artwork and public routes. Never force-push or automatically delete queue/archive branches.
- Use the existing `jjhuang22/library` GitHub → Vercel integration. Main builds with `npm run build`, output `dist/`. Do not create another hosting project. Report deployment status and live-check results accurately.
