# Library

This repository and the reading-companion idea were inspired by [Boris Cherny’s artifact](https://claude.ai/artifact/RdE6uE7WozcP2MLfx3BDky).

A static reading library for podcast episodes, books, and other standalone HTML companions. One catalog drives the sidebar, home page, search, and artifact pages. Acquired episodes appear under Spring/Fall seasons in the sidebar; clicking a season label or its chevron expands or collapses episode links without changing the main list. The home page sorts by creation date, newest first, with past years under Older. The Library title returns to the full home page; individual artifacts retain their Home links. No framework, database, or build dependencies are required.

Empty collections stay hidden until their first artifact is added.

Hosting uses the existing GitHub → Vercel integration. Push to `main` in `jjhuang22/library` to trigger Vercel's build (`npm run build`, output `dist/`). Do not create a ChatGPT Site or a separate deployment project for this library.

## Develop

Requires Node.js 22 or newer.

```sh
npm run dev    # Build and serve on port 3000 (override with PORT)
npm run build  # Refresh dist after edits; a running server serves it immediately
npm test       # Test the catalog and generated pages using Node's built-in runner
```

`public/` contains the library interface and standalone artifacts. `content/library.json` is the source of truth for collections and artifact metadata. `scripts/build.mjs` validates the catalog, copies static assets, and copies the full artifact to its public URL. `scripts/serve.mjs` is only the local development server.

Artifact links open the full HTML page directly. Each artifact should include a Home link to `/` and its original source link. Keep HTML self-contained or use root-relative asset URLs so it works at both its file path and public URL. Search uses artifact and collection titles, seasons, and release dates; it does not depend on an artifact's internal JavaScript or HTML structure.

## Save an artifact for later

The live library represents episodes the owner has listened to. Keep companions prepared ahead of listening in the repository with `"published": false` on their entry in `content/library.json`. The build omits these entries from the public catalog (including navigation and search) and excludes both their generated routes and original HTML files from `dist/`. Their source, artwork, and original creation dates stay saved in Git. This controls publication, not repository privacy; previously shared or downloaded copies are unaffected.

When the owner is ready to publish an episode, change its flag to `"published": true`, build and test, then commit, push, and deploy through the existing hosting workflow. Do not change its creation date. Omitting the flag also publishes an entry for compatibility with existing artifacts. New Acquired companions should use `"published": false` until the owner confirms they have listened or explicitly asks to put that episode live. Do not automatically publish other queued episodes when deploying an unrelated update.

## Add an artifact

For Acquired episodes, follow the [artifact writing and design guide](docs/acquired-artifacts.md).

Base the companion exclusively on the Acquired recording and its full transcript, including the hosts’ concluding analysis. Do not add outside-source facts, later financial updates, or independently written business lessons. Attribute the hosts’ arguments and preserve their estimates, uncertainty, and disagreements. Prefer an official transcript; when a mirror supplies the same episode audio transcription, identify it accurately and use only the transcript, not the mirror’s summaries. The official episode page may supply metadata and clearly identified corrections; its bibliography does not authorize importing outside material. Audit substantive claims against transcript passages, and remove unsupported content rather than just its citations.

All Acquired companions should use the illustrated editorial style established by the Disney and Home Depot artifacts: warm paper backgrounds, Cormorant Garamond headings and prose (the bundled font in `public/fonts/cormorant.woff2`, applied through `public/artifact-type.css`), and original watercolor illustrations with textured paper, loose pigment washes, and soft edges. Include a watercolor cover and add relevant scenes at major story moments where they help explain the narrative. Adapt restrained accent colors to the company, keep illustrations responsive with descriptive alt text, and label imagined scenes as conceptual rather than historical photographs or exact reconstructions. Keep diagrams precise and readable alongside the artwork.

Preserve each episode's distinctive navigation design: Disney's film reel, Home Depot's tape measure, Hermès' stitched leather strap, Costco's printed receipt, Rolex's chapter hands on a watch bezel, Formula 1's winding race circuit and odometer, and Ferrari's arcing dashboard with a moving needle. Do not flatten these designs into uniform bars just to share an interaction. Shared code standardizes feedback, not presentation.

Use `public/episode-timeline.js` for the same moving **h:mm:ss** popup, chapter title/range, keyboard previews, and chapter jumps as Disney. Preserve the themed HTML and CSS around it. The component's `{chapters: [{start, target, title}], end}` data uses seconds and real document IDs. Linear rulers map horizontal position to time; curved gauges map their arc; race circuits use their route and verified corner cues to calculate time between corners. Keep the pointer preview and click destination aligned. Keyboard focus previews a marker's verified start, arrows/Home/End move focus, Enter/Space jump, and Escape dismisses.

Keep Home and Chapters above the design, with no internal timeline scrollbars, persistent helper captions, or swipe prompts. Fit the original shapes into mobile widths rather than replacing them. Make receipt labels consistent (all visible or all omitted at a breakpoint), and let bezel indices represent actual chapters rather than adding unrelated clock numbers. The dropdown supplies large touch targets when timeline marks are close together. Use one verified timing version for cues and the endpoint; put provenance and any nonlinear geometry or cue-extent caveat in source notes. Check moving hover times, curved paths, marker focus, clicks, tooltip bounds, dropdown layering, and 320px layouts in a browser.

Use actual watercolor image assets for the cover and selected story scenes; basic geometric SVG drawings are not substitutes for painted artwork. Reserve SVG for precise explanatory diagrams and navigation. Link `public/artifact-type.css` last in each companion's head so typography stays consistent. Check the finished images and themed navigation in a real browser at desktop and mobile widths.

1. Save its HTML under `public/artifacts/<collection>/`.
2. Add an entry to `content/library.json`. Set `"published": false` for queued episodes; publish only when the owner has listened or explicitly requests it live. Add a collection to `categories` if needed.
3. Run `npm run build` and `npm test`, then check the artifact in a browser at desktop and mobile widths.
4. Commit the HTML, catalog, fonts/styles, and all referenced image assets to this repository. Push the commit to the agreed remote branch; local or generated `dist/` files alone are not repository delivery.

Example entry:

```json
{
  "id": "example-book",
  "title": "Example Book",
  "category": "autobiographies",
  "addedOn": "2026-10-06",
  "file": "/artifacts/autobiographies/example-book.html"
}
```

Each artifact has `id`, `title`, `category`, `addedOn`, and `file`. `addedOn` is displayed as **Created** and preserved through revisions. Acquired entries also require `releasedOn`, displayed as **Released**; other collections may optionally include it. All dates are calendar dates in `YYYY-MM-DD` format. The build derives Acquired season labels from release dates using the library convention: January–August is **Spring [Year]**, September–December is **Fall [Year]**. Older numbered seasons and summer releases follow the same convention. Each entry gets `/<category>/<id>/`; IDs may repeat in different collections, but a full route must be unique.
