# Recovered selected Acquired queue

Recovery date: October 20, 2026. Repository: `jjhuang22/library`.

## Branch roles

- `queued/acquired-selected-episodes` preserves all original authoring commits, HTML, image assets, evidence maps and `.codex/acquired-artifact-queue.json`. It is a recovery archive. Never merge or publish it wholesale.
- `codex/recover-acquired-queue` carries this handoff, the reconciled 46-episode state and queue discovery registry. Relative to workflow commit `28cb451`, it changes metadata/documentation only and adds no deployable artifact.
- Each `queue/acquired/<id>` branch contains the six published artifacts already in the new workflow base plus exactly one selected episode. It has a self-contained bundle, catalog entry and durable source map.

## Find the work in another checkout

Some existing cloud checkouts fetch only main. Fetch the explicit refs before deciding a branch is missing:

```sh
git fetch origin '+refs/heads/queued/acquired-selected-episodes:refs/remotes/origin/queued/acquired-selected-episodes' '+refs/heads/queue/*:refs/remotes/origin/queue/*' '+refs/heads/codex/recover-acquired-queue:refs/remotes/origin/codex/recover-acquired-queue'
git switch --track origin/codex/recover-acquired-queue
npm run queue:list
```

For an episode, switch to its remote tracking branch or create a separate worktree. Do not copy a combined catalog onto main.

## Workflow prerequisite and selective publication

The migrated branches descend from `28cb451c9a34ae47ec1104e5a64f5f79e6fd4928` (Standardize artifact bundles and selective publication workflow), the same shared workflow base used by the other migrated queue branches. At recovery, remote main was `898dd46422971566ffba6ce7f0d17a2490421473` and had not yet received that maintenance change. The new bundle build and shared assets must reach main through the separately authorized maintenance workflow before the selective publication tool can run there. This recovery did not push main or deploy.

Once that shared maintenance is on main, the updated registry and canonical state here can be applied as a metadata-only maintenance change. Do not merge the combined archive. The selected episode branch’s `verified` entry is authoritative; main’s registry is only a discovery index.

After the user explicitly requests publication of one episode, follow `docs/publishing.md`:

```sh
npm run artifact:publish -- acquired/<id> --prepare
# Inspect the prepared worktree and browser rendering.
npm run artifact:publish -- acquired/<id> --push
```

These commands are instructions for future authorized publication; neither publication step was invoked against GitHub during recovery. Queue branch pushes may receive hosting previews under existing configuration; main remains the production boundary. No hosting or sharing settings were changed.

## Preserved authoring state

The canonical state is `content/acquired-artifact-queue.json`: 14 completed, 32 pending, none active. Novo Nordisk is next. Original order, excluded Benchmark Part II / Sequoia Part II, and the selected Howard Schultz Starbucks episode are unchanged. Original artifact commits and review outcomes remain alongside migration commits. The archived `.codex` state is retained for recovery rather than being discarded.

## Migration verification

Each migrated episode was built and tested using the new workflow; actual Chromium at 1440px, 390px and 320px checked images, fonts, anchors, external links, overflow, pointer/keyboard navigation, menus and controls. Image files were copied byte-for-byte, dates and narrative content preserved, and only asset paths changed in the HTML. The three shared Acquired assets are byte-identical to those used in the original reviewed companions.

Prior complete-transcript independent reviews are carried forward from the committed original state and maps; this path migration is not claimed as a newly performed source audit. Permanent maps retain transcript provenance, cues, sections and qualifications, with temporary review paths and production logs omitted. The original maps and review records remain in the archive.

## Episode branches

| Order | Episode | Remote branch | Migration commit | Original reviewed artifact |
| --- | --- | --- | --- | --- |
| 1 | Disney: The Renaissance and the Empire | `queue/acquired/disney-the-renaissance-and-the-empire` | `d823db5665ad01e61a84da75a8d13f51fd500d3a` | `3ad3aba2b203dcb53ef1950b39c3a12daa478631` |
| 2 | Coca-Cola | `queue/acquired/coca-cola` | `4505772b3c3aaebcad14227cf29d6c89a92f8bc5` | `a5de30a2a515d5b5bd053b674f868074d0222fc8` |
| 3 | Trader Joe's | `queue/acquired/trader-joes` | `56d16704626e041965b6c2219a05bcd618be276a` | `5943918e3572dcb4496dda81e572ba7ce5c51fa0` |
| 4 | Google: The AI Company | `queue/acquired/google-the-ai-company` | `86cddc1d39af9577dcfaa12ab936c261cc7e188a` | `d392f8a2c1777121be6e6d5d084e790628a26208` |
| 5 | Alphabet Inc. | `queue/acquired/alphabet-inc` | `085e92a41e7ec30c22495c2fea04ac644f6886ee` | `00808ce3dbc5016c8e851333284998b57af1c3bf` |
| 6 | Google: The Origin of Search | `queue/acquired/google-the-origin-of-search` | `8362d8ef27eb28521562417a777e74e43327ccd0` | `7f9b8b369307a697c9702ae8fb322f386a9ce615` |
| 7 | IKEA | `queue/acquired/ikea` | `45e06e67de293fa5f767e0b3ecdf24a232708b0e` | `99171f8a7d747f3ce724a413b168ab52cdc53daa` |
| 8 | The NFL (2026 remaster and follow-up) | `queue/acquired/the-nfl` | `99c7177a85680321f25352b2beac383f2f3f19fb` | `6dfd53766df65527c1bf642e5a2f36e0721b88b3` |
| 9 | Visa | `queue/acquired/visa` | `659192ffca65243a68a726dba2a13be5dcdc2c83` | `2b4907d01ffba5aca36bc6e3019b49889edc9f64` |
| 10 | Meta | `queue/acquired/meta` | `07aee5cfca35db0ee500912a98b214af500dd370` | `8cbdb934efcabcc2d74b67b5b649e94dfe5b96c8` |
| 11 | Mars Inc. (the chocolate story) | `queue/acquired/mars-inc` | `05487d1a7e9b9864d41d5fdcc246729f9166111d` | `97c29da819803e9da9f27735a82a25f5800abab9` |
| 12 | Epic Systems (MyChart) | `queue/acquired/epic-systems` | `ff37431b11a62e45c5b8e54c8438d63655000366` | `8eeb220d9ba02049cc36660145f4e8285dbfc8d4` |
| 13 | Microsoft Volume I | `queue/acquired/microsoft-volume-i` | `01061616ddd7f8d69aa9de947894c0fbcd142c8a` | `8210dddc516f381f19120a158cc77dac87cf1309` |
| 14 | Microsoft Volume II | `queue/acquired/microsoft-volume-ii` | `b922c2238447431e380eb257609ea189c7389c61` | `cd136445de0784fc7111fcfaac8882b36de139b2` |
