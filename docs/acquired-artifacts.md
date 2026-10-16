# Acquired episode artifacts

Create an illustrated reading companion that faithfully tells the Acquired episode’s story and explains the hosts’ analysis. It should work for someone who has not listened and help listeners revisit the episode. The episode is the content boundary: do not supplement it with outside research or independently written business lessons.

## Episode evidence

- Read the full episode transcript before writing or revising. Use the official transcript when available. A transcript mirror may provide access to the same recording, but identify it as a mirror; do not use that site’s summaries or commentary as evidence or call it an official transcript.
- Ground every substantive event, figure, anecdote, comparison, diagram, and analytical claim in the recording. The official episode page may supply metadata and explicitly identified corrections. Its research bibliography is not permission to import facts from those outside sources.
- Preserve what the hosts qualify: estimates, disputed stories, uncertainty, disagreement, and the time of recording. Do not update figures with later company reports or silently present the hosts’ interpretation as established fact.
- Maintain a section-by-section evidence map while editing, noting transcript passages or listening cues for consequential claims. Remove unsupported material rather than merely deleting its source link.

## Prose and level of detail

- Write narrative prose, not transcript recaps or lists of facts. Follow the chronology and explain how one event led to the next.
- Introduce people through their backgrounds, incentives, and constraints. Include concrete decisions, contracts, setbacks, dates, and financial figures when they explain the story.
- Start with biography and concrete events, letting business meaning emerge from the story. Give major turning points several substantial paragraphs; compress transitions.
- Use plain language and a measured voice. Avoid generic motivational lessons and hindsight that makes uncertain decisions sound inevitable.
- Use occasional brief italic takeaways only to restate a point the hosts make. Attribute their arguments and distinguish them from narrated events; do not add your own strategic advice or extrapolated lessons.

## Sections

1. **Cover:** episode/company title, optional creative title, short premise, season, linked episode attribution, **Released** date, **Created** date, scope, and estimated reading time. Created is the catalog's original `addedOn` date. Include a meaningful opening illustration when useful.
2. **Chronological chapters:** chapter number, era, descriptive heading, short framing line, and narrative paragraphs. Include verified listening timestamps. A brief closing point is optional and must come from the hosts’ discussion.
3. **Explanatory interludes:** place diagrams, timelines, or interactive models where they clarify ownership, financing, distribution, or reinforcing businesses.
4. **Concluding analysis:** faithfully explain the hosts’ discussion of the business model, competitive advantages, and vulnerabilities. Use Seven Powers or other frameworks only as the hosts apply them, including their qualifications and disagreements.
5. **Episode index:** an optional compact index of the hosts’ observations linking back to their chapters, without adding advice or repeating the story.
6. **Sources:** the episode, the transcript used, and clearly identified official corrections, presented unobtrusively. Explain transcript and timestamp provenance accurately; exclude outside research references.

Cover the full episode, including the hosts’ concluding analysis. Combine or omit sections that do not earn their place; do not force equal chapter lengths or fourteen chapters.

## Design and formatting

- Use warm paper, dark text, and the bundled Cormorant Garamond font for headings, prose, labels, and controls, matching the reference typography. Load `/artifact-type.css` last in the document head. Keep body type generous and readable (26px desktop, 23px mobile), with restrained accent colors.
- Keep prose around 60–75 characters wide, with generous chapter spacing. Let illustrations and diagrams extend beyond the text column.
- Use one main heading, chapter headings, and smaller lesson headings. Reserve bullets and tables for comparisons, frameworks, and the playbook. Use italics sparingly.
- Adapt the illustration subjects and accents to the company. Disney’s blue/gold palette and film-reel treatment are specific to its story; other companions should use colors and motifs suited to their own subject while keeping the watercolor editorial style.
- Use original watercolor illustrations in every Acquired companion, following the Disney and Home Depot examples: textured warm paper, translucent pigment washes, soft painted edges, and restrained company-specific accents. Include a watercolor cover and select additional scenes for meaningful story moments, such as the founding, a turning point, or the customer experience. Place art where it helps the reader understand the narrative; do not illustrate every chapter merely to fill space. Use descriptive alt text, responsive images, and explicit conceptual-art captions. Preserve historical uncertainty and avoid presenting invented scenes as photographs or exact reconstructions. Diagrams and financial models should remain precise and legible rather than being rendered as paintings. Basic geometric SVG illustrations do not satisfy the watercolor requirement; SVG is appropriate for diagrams and navigation. Save actual painted image assets in the repository and verify their resolution, loading, and appearance in the finished pages.
- Preserve episode-specific navigation geometry and visual identity: film reel, tape measure, stitched leather strap, printed receipt, chapter hands on a watch bezel, winding race circuit/odometer, or arcing dashboard/needle. Do not replace these with uniform bars to achieve behavioral consistency. Share the interaction, not the presentation.
- Use `/episode-timeline.js` for Disney's continuously moving **h:mm:ss** popup, title/range, keyboard previews, and chapter jumps. Let the themed markup and CSS retain its own shape. Linear tracks map x-position to time; gauges follow their arc; circuits interpolate verified times along the route between chapter corners. A pointer click must select the same time/chapter as its preview. Keyboard focus shows the marker's verified start; arrows and Home/End move focus, Enter/Space jump, and Escape dismisses.
- Keep **Home** and Chapters above the design. Fit the original geometry into mobile widths, with no internal timeline scrollbars, helper captions, or swipe prompts. Make receipt labels consistent at each breakpoint and bezel indices correspond to actual chapters. The dropdown provides large touch targets for closely spaced markers. Clamp tooltips to the viewport and keep menus above them.
- Use one verified cue set and endpoint version. Do not mix ad-edited timestamps with an original-upload duration. Document provenance, nonuniform route spacing, and cue-extent limitations in source notes. Browser-check movement within an interval, curved paths, marker focus, pointer/keyboard jumps, tooltip bounds, dropdown layering, and 320px layouts.
- On mobile, stack diagrams and simplify navigation. Preserve readable type, keyboard access, touch targets, image descriptions, and reduced motion. Prevent horizontal overflow.

## Accuracy and delivery

- Verify consequential claims. Do not invent quotes, facts, precision, or timestamps. Label approximations, conceptual diagrams, and imagined artwork; distinguish revenue, profit, box office, and cash flow.
- Deliver full standalone HTML with **Home** linking to `/`. Link the episode attribution itself to the original source. External links must open a new tab with `target="_blank"` and `rel="noopener noreferrer"`; keep internal chapter links in the current tab. Keep assets embedded or root-relative; avoid a library wrapper.
- Add the catalog entry with `id`, `title`, `category`, `addedOn`, `releasedOn`, and `file`. Verify the original release date from Acquired. The build derives the library season from that date: January–August → **Spring [Year]**, September–December → **Fall [Year]**. This is the library's two-season convention, including older numbered seasons and summer episodes. Use the same label on the artifact cover. Keep source links and attribution in the artifact itself. Preserve the original creation (`addedOn`) date when revising. Check links, images, and interactions on desktop and mobile.

- Repository delivery includes committing the standalone HTML, catalog entries, shared typography, and referenced assets, then pushing to the agreed remote branch. A local workspace edit or a `dist/` build alone is not delivery.
