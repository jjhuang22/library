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

The automation **Create Acquired companions** points to the chat **Find missing Acquired artifacts**. Its last recorded completion reports Microsoft Volume II at commit `cd13644`, fourteen of forty-six episodes completed, with Novo Nordisk next. It saved the completed files and state locally on `queued/acquired-selected-episodes`; the corresponding branch was not pushed to GitHub and is absent from this workspace.

Reported completed episodes are Disney The Renaissance and the Empire, Coca-Cola, Trader Joe's, Google The AI Company, Alphabet Inc., Google The Origin of Search, IKEA, The NFL, Visa, Meta, Mars Inc., Epic Systems, Microsoft Volume I, and Microsoft Volume II. They are registered as `source-unavailable`, not falsely counted as locally audited or migrated. Chat history reports reviews and tests, but does not substitute for recovering actual HTML, image assets, evidence maps, and the committed authoring state.

Recover and push the original combined branch from that chat's workspace without merging it into main. Then migrate each recovered episode from that source into its registered individual queue branch, reconcile the original `.codex/acquired-artifact-queue.json` state into `content/acquired-artifact-queue.json`, and recheck sources, maps, assets, builds and browser behavior. Do not regenerate those fourteen based only on their titles or invent completion records. Preserve the original selection order, exclusions, creation dates, and completed work.

The automation prompt now points to the new authoring/publishing documents, requires official-transcript-first lookup, individual saved queue branches and durable evidence maps, and backs up complete queue branches without publishing them. Its existing resume schedule and notification preferences are preserved.

## Evidence consistency for published artifacts

Existing SpaceX, TSMC and Renaissance maps are consolidated under `docs/evidence/acquired/`. Disney, Home Depot and Costco receive source maps from an actual source review rather than a fabricated migration audit. Artwork previously embedded in Disney/Home Depot HTML is extracted byte-for-byte into their episode bundles. Reader-facing citations remain in each companion.
