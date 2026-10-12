# Library

This repository and the reading-companion idea were inspired by [Boris Cherny’s artifact](https://claude.ai/artifact/RdE6uE7WozcP2MLfx3BDky).

A static reading library for podcast episodes, books, and other standalone HTML companions. One catalog drives the sidebar, home page, search, and artifact pages. Acquired episodes appear under Spring/Fall seasons in the sidebar; clicking a season label or its chevron expands or collapses episode links without changing the main list. The home page sorts by creation date, newest first, with past years under Older. The Library title returns to the full home page; individual artifacts retain their Home links. No framework, database, or build dependencies are required.

Empty collections stay hidden until their first artifact is added.

## Develop

Requires Node.js 22 or newer.

```sh
npm run dev    # Build and serve on port 3000 (override with PORT)
npm run build  # Refresh dist after edits; a running server serves it immediately
npm test       # Test the catalog and generated pages using Node's built-in runner
```

`public/` contains the library interface and standalone artifacts. `content/library.json` is the source of truth for collections and artifact metadata. `scripts/build.mjs` validates the catalog, copies static assets, and copies the full artifact to its public URL. `scripts/serve.mjs` is only the local development server.

Artifact links open the full HTML page directly. Each artifact should include a Home link to `/` and its original source link. Keep HTML self-contained or use root-relative asset URLs so it works at both its file path and public URL. Search uses artifact and collection titles, seasons, and release dates; it does not depend on an artifact's internal JavaScript or HTML structure.

## Add an artifact

For Acquired episodes, follow the [artifact writing and design guide](docs/acquired-artifacts.md).

All Acquired companions should use the illustrated editorial style established by the Disney and Home Depot artifacts: warm paper backgrounds, Cormorant Garamond headings and prose (the bundled font in `public/fonts/cormorant.woff2`, applied through `public/artifact-type.css`), and original watercolor illustrations with textured paper, loose pigment washes, and soft edges. Include a watercolor cover and add relevant scenes at major story moments where they help explain the narrative. Adapt restrained accent colors to the company, keep illustrations responsive with descriptive alt text, and label imagined scenes as conceptual rather than historical photographs or exact reconstructions. Keep diagrams precise and readable alongside the artwork.

The compact sticky navigation must belong to the episode's world: a film reel for Disney, tape measure for Home Depot, stitched leather for Hermès, warehouse receipt for Costco, watch bezel for Rolex, circuit kerbs for Formula 1, or dashboard for Ferrari. Express the theme through the material, emblem, and edge treatment. Chapter boundaries are the only major divisions; do not add unrelated hour indices, aisle labels, or decorative chapter counts.

Every companion must use Disney's timeline interaction, shared through `public/episode-timeline.js` and `public/episode-timeline.css`. Reuse an existing `.episode-timeline` block and update its embedded `{chapters: [{start, target, title}], end}` configuration; timestamps are seconds, and targets are real document IDs. Moving the pointer anywhere along the full track continuously previews the actual **h:mm:ss at that position**, not just a fixed chapter-start time. The same popup shows the chapter title and its start/end range. Keyboard focus previews the chapter start; arrow keys, Home/End, Enter/Space, and Escape provide navigation and dismissal. Keep the reading-position clock, current chapter, and cursor consistent across episodes, and keep Home and the Chapters dropdown above the track.

The full timeline must fit its container at every viewport width, with **no internal scrollbars**, hidden chapters, persistent timeline captions, swipe instructions, or helper legends. Short intervals retain their time proportions; the Chapters dropdown provides larger touch targets. Do not force minimum segment widths that distort timing. Use a single verified timing version for chapter cues and the endpoint; document any original-upload or cue-extent limitations in source notes rather than captioning the navigation. Browser-check actual hover movement, both ends, keyboard focus, chapter jumps, tooltip bounds, dropdown layering, and 320px mobile layouts.

Use actual watercolor image assets for the cover and selected story scenes; basic geometric SVG drawings are not substitutes for painted artwork. Reserve SVG for precise explanatory diagrams and navigation. Link `public/artifact-type.css` last in each companion's head so typography stays consistent. Check the finished images and themed navigation in a real browser at desktop and mobile widths.

1. Save its HTML under `public/artifacts/<collection>/`.
2. Add an entry to `content/library.json`. Add a collection to `categories` if needed.
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
