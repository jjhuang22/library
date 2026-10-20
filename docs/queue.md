# Artifact queue inventory

The queue registry is `content/queue.json`. Published status comes from main's catalog, not from the continued existence of an old queue branch. Each available queued companion is migrated to its own `queue/acquired/<id>` branch, with an episode bundle and retained source map. No queued episode is added to main's public catalog by this cleanup.

## Available queued artifacts

| Episode | Branch | Source audit |
| --- | --- | --- |
| Hermès | `queue/acquired/hermes` | Full spoken transcript mirror read after official transcript retrieval attempts; source map and factual/qualification fixes retained. |
| Rolex | `queue/acquired/rolex` | Full transcript mirror and official corrections reviewed; source map and timing/qualification fixes retained. |
| Formula 1 | `queue/acquired/formula-1` | Full mirror, official correction and publisher timing reviewed; source map and concluding-analysis qualification fixed. |
| Ferrari | `queue/acquired/ferrari` | Full mirror and official correction reviewed; source map, host disagreement and timing provenance fixed. |
| The NBA | `queue/acquired/nba` | Complete reader-supplied official transcript reviewed; official-first retrieval limitation and durable passage anchors recorded. |
| Vanguard | `queue/acquired/vanguard` | Complete reader-supplied official transcript and official corrections reviewed; durable source map cleaned. |

The web reader returned Sources/show-note views for these official episode URLs, without the complete spoken transcript or a usable transcript-tab link. Direct rendered-tab inspection was blocked by environment access. This establishes a retrieval limitation, not absence of an official transcript. The authoring guide requires official-first lookup and permits accurately identified complete-source fallbacks.

Original files remain recoverable from `b808799` (NBA/Vanguard and already-published Renaissance) and `6021cfa` (Hermès/Rolex/Formula 1/Ferrari). The combined local branch is retained as an archive, not used by the publication command. Renaissance is already published and has no active queue entry.

## Scheduled workflow source recovery

The fourteen completed companions reported by the original chat have now been recovered from `queued/acquired-selected-episodes`, migrated to individual `queue/acquired/<id>` branches, and checked under the bundle workflow. Their prior full-transcript review records and original authoring commits are preserved rather than recreated from episode titles.

See [the recovery handoff](acquired-queue-handoff.md) for fetch commands, branch/commit inventory, workflow dependencies and verification. The reconciled state is `content/acquired-artifact-queue.json`: fourteen complete, thirty-two pending, Novo Nordisk next, with the original order and exclusions retained. The original `.codex` state remains on the combined recovery archive. Never merge that archive into main.

## Evidence consistency for published artifacts

Existing SpaceX, TSMC and Renaissance maps are consolidated under `docs/evidence/acquired/`. Disney, Home Depot and Costco receive source maps from an actual source review rather than a fabricated migration audit. Artwork previously embedded in Disney/Home Depot HTML is extracted byte-for-byte into their episode bundles. Reader-facing citations remain in each companion.
