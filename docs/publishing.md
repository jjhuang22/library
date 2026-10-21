# Queueing and publishing artifacts

Creating and publishing are separate actions. A new companion defaults to a saved queue branch. An unambiguous “publish [episode]” request authorizes publishing that episode alone, including checks, one commit, a push to main, and deployment verification.

## Queue an artifact

1. Fetch current main and create `queue/<collection>/<id>` from it. Use one branch per artifact, even when several are requested together. Register the branch in `content/queue.json` on main in a metadata-only update; registration does not deploy artifact files. Preserve all other registry entries and the `authoring` plan.
2. Read the collection's authoring instructions. For Acquired, find the complete transcript on its official episode website first; follow `docs/acquired/authoring.md` if that text cannot be retrieved.
3. Save `public/artifacts/<collection>/<id>/index.html` and all episode-specific images in that directory. Root-relative asset links must name that bundle. General shared assets belong on main before queue branches depend on them.
4. Add exactly that episode to the branch's `content/library.json`, preserving its original `addedOn`. Acquired also requires the original `releasedOn`; seasons derive from that release date. Keep permanent source evidence in `docs/evidence/<collection>/<id>.md`.
5. Set that branch's queue entry to `verified` only after reading the full transcript, checking consequential claims and corrections, and completing its evidence map. A reviewer may use the map but must check the source. `needs-source-review` means the branch can be preserved and previewed but cannot yet be published by the script. Missing legacy maps require a real review, not invented audit notes.
6. Build, test, and inspect desktop and mobile rendering, image loading, links, and navigation. Commit all source and assets, and push the individual queue branch for backup. Copy the completed evidence map to the same path on main with the queue registration. Run `npm run evidence:check` there. Queue branches can trigger Vercel previews; only main is the production publication boundary. GitHub and preview visibility are not confidentiality controls.

`npm run queue:list` lists registered queue branches. Evidence maps contain source evidence rather than production logs. The branch's selected queue entry is authoritative for its current source-review status; main's registry is a discovery index.

## Publish one episode

1. Resolve the user's episode to one registered collection/id. Ask only when the name is ambiguous. If current main already contains it, report already published and make no new commit.
2. Run `npm run artifact:publish -- <collection>/<id> --prepare`. The script fetches main and queue refs, checks the selected source branch and review status, and creates an isolated publication worktree from current main. It copies only that episode's bundle, source map, and catalog entry. It removes only that episode from the prepared queue registry. Other main entries and queued episodes are preserved.
3. Read the printed staged diff. Inspect the prepared artifact in a real browser at desktop, 390px and 320px widths, including images, fonts, internal/external links, chapter jumps, keyboard interaction, menu layering, and timeline cues when present. Keep verification in the commit/review record; do not append test logs to the evidence map.
4. Run `npm run artifact:publish -- <collection>/<id> --push`. This requires the prepared worktree. It checks the scope again, rebuilds and tests, creates one episode-specific commit, and pushes that commit to main without force. It refuses unapproved shared-file changes and refuses a changed main base instead of overwriting other publications. Never merge the entire queue branch.
5. Check the new commit's Vercel status through GitHub, then load the live artifact and its artwork. The established repository is `jjhuang22/library`; homepage metadata currently names `https://acquired-beta.vercel.app`. Confirm the configured domain rather than inventing another project or URL. A successful Vercel status and a live-page check are separate results. If network policy blocks the live check, report that limit accurately.

The tool defaults to `--prepare`; `--push` is the explicit remote-write step. The natural-language publication request already authorizes that step after verification. It does not authorize publishing a different episode. The tool prints publication worktrees and records recovery metadata in Git's local administrative directory, never in the public bundle.

## Concurrent changes and recovery

- Keep queue sources committed and their working trees clean. The script reads a specific committed queue snapshot, not uncommitted draft edits.
- A queue branch may lag main. Publication starts from latest main and selects the requested bundle instead of replaying an old catalog wholesale. Changes outside the episode bundle, source map, and queue/catalog metadata must be moved into a separate reviewed maintenance change.
- If main advances after preparation, make a fresh preparation with `--prepare --fresh`; the earlier worktree/commit remains available. Recheck the resulting artifact and diff before pushing. Never force-push to resolve this.
- A failed push leaves the local publication commit available. Retry `--push` when main has not advanced. If main already contains the same episode, report its published state rather than duplicating it.
- Do not delete queue or archive branches automatically. After successful publication, main's catalog determines published status even if an old queue branch or archival combined branch still contains the episode.
- The build publishes only catalog-listed bundles, plus the library shell and shared assets. Removing a catalog entry excludes its bundle from dist even if its source folder remains in a branch. Evidence, the queue registry, and source-review notes are never copied to dist.

## Scheduled authoring and retained evidence

`content/queue.json` is the single source of queue state. Its `artifacts` array locates prepared branches and their source-review status. Its `authoring` object retains the requested episode order, active episode, attempts, blockers, original completion commits, independent review outcome, and exclusions. `completed` means authored and reviewed; main's catalog alone determines whether an episode is published. Publishing removes only the selected registry entry and preserves the authoring history.

The scheduled loop reads current main's instructions and state at each run, resumes an active episode or selects the next unfinished actionable episode in order, and uses one author at a time with a separate independent reviewer. It commits and pushes the full bundle on `queue/<collection>/<id>`. After review and browser verification, a metadata-only main update registers the branch, retains its evidence map, and updates authoring progress. It never puts queued HTML or artwork on main or calls the publish command. Fetch and reconcile concurrent metadata updates before pushing; never overwrite another run's progress. Store any execution lock in Git's administrative directory, and verify worker liveness before treating a lock as active. Report capability blockers honestly rather than repeatedly retrying unchanged failures.

Keep one concise evidence map for every published and completed queued artifact on main, even while its HTML and artwork remain on its queue branch. This makes coverage discoverable without checking out twenty branches. The branch retains the matching map used for its own review. Planned episodes with no artifact have no map yet. `npm run evidence:check` verifies coverage against the catalog and completed queue registry. Maps are maintainer documentation, never reader-facing build output. Do not retain separate migration inventories, handoff documents, duplicate queue state, temporary source copies, or test logs as standing documentation.

Previously combined sources remain recoverable in Git history. Canonical reader URLs stay `/<collection>/<id>/`; generated copies preserve old `/artifacts/<collection>/<id>.html` links. Preserve artwork bytes and original creation dates during structural changes.
