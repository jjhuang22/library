# Creating and publishing artifacts

Creation saves an artifact on its own branch. Publication happens only when the user requests it, usually after listening to or reading the source. An unambiguous “publish [episode]” request authorizes the entire procedure below without another confirmation.

## Ownership and discovery

- The scheduled automation owns the ordered list of sources to create and any exclusions in its saved instructions. A local untracked file may cache progress but must not be its only durable record.
- Saved `queue/<collection>/<id>` branches are the unpublished queue. Fetch them with `npm run queue:list`, which reports titles, readiness and blockers. It excludes episodes already present in main's catalog, even if their old branches remain.
- Main's `content/library.json` determines what is published. A queue branch's catalog includes its one additional artifact. Its evidence map records source review and readiness.
- Main contains evidence only for published artifacts. Each queue branch contains the published baseline plus evidence for its own artifact. Creating or reviewing an artifact makes no main commit and does not trigger a production publication.

The shared workflow is this file. Collection-specific source, narrative and design rules live in `docs/collections/<collection>.md`. Evidence belongs in `docs/evidence/<collection>/<id>.md` and stays out of the reader build.

## Create and review

1. Fetch current main and remote queue branches. Check both the published catalog and saved branches before authoring; resume an existing draft instead of duplicating it. Create `queue/<collection>/<id>` from current main for a new artifact. Use one branch per artifact.
2. Read the applicable collection guide. For Acquired, use `docs/collections/acquired.md`: find and read the full official episode transcript first, including the Transcript tab or linked view, check official corrections, and document any permitted complete-transcript fallback accurately.
3. Save `public/artifacts/<collection>/<id>/index.html` and its images within that directory. Root-relative links must name the bundle. Add only that artifact's entry to the branch catalog, preserving original `addedOn` and source-release metadata. Shared assets or tooling changes belong in separate maintenance work on main.
4. Retain a concise source map at `docs/evidence/<collection>/<id>.md`. Record consequential passages, qualifications, corrections and timestamp provenance. Do not retain temporary paths, full third-party transcript copies, migration inventories or execution logs.
5. Have a separate independent reviewer check the complete source and artifact, including concluding analysis, factual fidelity, omissions, artwork, interactions and mobile rendering. Fix findings and have material fixes rechecked. Run `npm run build`, `npm test`, and `npm run evidence:check`; inspect the browser at desktop, 390px and 320px widths. A source map supports review but does not substitute for reading the source.
6. Record readiness in the source map as described below, commit the complete bundle and evidence, and push the individual queue branch for backup. A draft or unavailable review remains explicitly unfinished. Never push queued HTML or artwork to main from the authoring loop. Branch previews may exist; only main is the production publication boundary.

## Review record

Keep a single JSON comment on the first line of the episode's evidence map, followed by the actual source evidence:

```md
<!-- artifact-review: {"status":"verified","bundleTree":"<reviewed Git tree hash>"} -->
# Episode — source evidence
```

Use `draft`, `needs-source-review`, or `blocked` until review and verification are complete; an optional `blocker` string records a concrete limitation. Set `verified` only after the independent review and required checks. Missing or malformed review records never count as verified.

Stage the final HTML and images, then obtain the bundle hash with:

```sh
git add public/artifacts/<collection>/<id>/
git rev-parse "$(git write-tree):public/artifacts/<collection>/<id>"
```

Record that hash only for the reviewed bundle, then stage the evidence map and commit. Changing any HTML or image bytes invalidates readiness until the changed bundle has been reviewed and its record updated. Renaming or merging unrelated published files does not invalidate an unchanged bundle. Do not mark existing work verified without a substantiated source and independent review.

## Publish one artifact

1. Resolve the requested source to one collection/id using remote branch names and their catalog titles. Ask only when ambiguous. If current main already lists it, report already published and make no commit. A publication request is the user's signal to publish; do not infer it from automation completion or elapsed time.
2. Run `npm run artifact:publish -- <collection>/<id> --prepare`. The tool fetches current main and remote queue branches, checks the selected branch's verified review against its committed bundle, and creates an isolated worktree from main. It copies only that bundle, its evidence map and its catalog entry. It builds and tests the result. An older source branch must not overwrite a newer main catalog or import unrelated maintenance.
3. Read the staged diff and browser-check the prepared artifact at desktop, 390px and 320px widths. Check artwork, fonts, internal/external links, chapter navigation, keyboard access, menus, tooltips and verified timing cues where applicable. Verification logs belong in review/commit records, not the source map. If a material fix is required, update and review the queue branch, push it, and prepare afresh.
4. Run `npm run artifact:publish -- <collection>/<id> --push`. The tool rechecks the source snapshot, reviewed bundle, selected-file scope and main base, rebuilds/tests, creates one artifact-specific commit, and pushes normally to main. It never merges the entire queue branch or force-pushes.
5. Check the commit's Vercel status through GitHub, then load the live artifact and its artwork. Use the existing `jjhuang22/library` project; the repository homepage currently names `https://acquired-beta.vercel.app`. Confirm its configured domain rather than inventing another host. Report deployment success and live-page checks separately, including any blocked verification.

The tool defaults to preparation; `--push` completes the user-authorized publication after verification. It stores local recovery pointers in Git's administrative directory. No queue registry or automation backlog is copied into the published catalog or build.

## Concurrent work and recovery

- Read committed remote source snapshots; keep drafts committed and pushed so another workspace can resume them. Queue discovery prunes deleted remote queue refs and never treats an unpushed local branch as saved work.
- If main or the selected source changes after preparation, use `--prepare --fresh` and repeat the checks. Earlier worktrees and commits remain recoverable. Never overwrite concurrent publications.
- A failed push leaves its local publication commit available. Retry `--push` if main and the source are unchanged; if main already lists the artifact, report that state instead of duplicating it.
- Preserve queue and archive branches unless the user requests their deletion. Published branches are filtered from queue listings automatically.
- The scheduled loop uses one author at a time, resumes drafts before selecting later work, and verifies worker liveness before honoring a temporary lock. Keep locks and transient logs outside tracked files. Record episode-specific blockers on their branch and skip unchanged blockers; stop and report a global capability blocker rather than claiming completion or retrying indefinitely.
