# Acquired episode artifacts

Create an illustrated reading companion that tells the episode’s story and explains its business significance. It should work for someone who has not listened and help listeners revisit the episode.

## Prose and level of detail

- Write narrative prose, not transcript recaps or lists of facts. Follow the chronology and explain how one event led to the next.
- Introduce people through their backgrounds, incentives, and constraints. Include concrete decisions, contracts, setbacks, dates, and financial figures when they explain the story.
- Start with biography and concrete events, letting business meaning emerge from the story. Give major turning points several substantial paragraphs; compress transitions.
- Use plain language and a measured voice. Avoid generic motivational lessons and hindsight that makes uncertain decisions sound inevitable.
- Use occasional brief italic takeaways within the narrative. Ground business lessons in specific events; distinguish facts, the hosts’ arguments, and your interpretation.

## Sections

1. **Cover:** episode/company title, optional creative title, short premise, season, linked episode attribution, **Released** date, **Created** date, scope, and estimated reading time. Created is the catalog's original `addedOn` date. Include a meaningful opening illustration when useful.
2. **Chronological chapters:** chapter number, era, descriptive heading, short framing line, narrative paragraphs, and a concise business lesson. Include verified listening timestamps.
3. **Explanatory interludes:** place diagrams, timelines, or interactive models where they clarify ownership, financing, distribution, or reinforcing businesses.
4. **Concluding analysis:** explain the business model, competitive advantages, what is hard to reproduce, and vulnerabilities. Use frameworks such as Seven Powers only when helpful.
5. **Playbook:** a compact index of specific lessons linking back to their chapters, without repeating the story.
6. **Sources:** the episode and reliable supporting references, presented unobtrusively.

Cover the full episode, including the hosts’ concluding analysis. Combine or omit sections that do not earn their place; do not force equal chapter lengths or fourteen chapters.

## Design and formatting

- Use warm paper, dark text, and the bundled Cormorant Garamond font for headings, prose, labels, and controls, matching the reference typography. Load `/artifact-type.css` last in the document head. Keep body type generous and readable (26px desktop, 23px mobile), with restrained accent colors.
- Keep prose around 60–75 characters wide, with generous chapter spacing. Let illustrations and diagrams extend beyond the text column.
- Use one main heading, chapter headings, and smaller lesson headings. Reserve bullets and tables for comparisons, frameworks, and the playbook. Use italics sparingly.
- Adapt the illustration subjects and accents to the company. Disney’s blue/gold palette and film-reel treatment are specific to its story; other companions should use colors and motifs suited to their own subject while keeping the watercolor editorial style.
- Use original watercolor illustrations in every Acquired companion, following the Disney and Home Depot examples: textured warm paper, translucent pigment washes, soft painted edges, and restrained company-specific accents. Include a watercolor cover and select additional scenes for meaningful story moments, such as the founding, a turning point, or the customer experience. Place art where it helps the reader understand the narrative; do not illustrate every chapter merely to fill space. Use descriptive alt text, responsive images, and explicit conceptual-art captions. Preserve historical uncertainty and avoid presenting invented scenes as photographs or exact reconstructions. Diagrams and financial models should remain precise and legible rather than being rendered as paintings. Basic geometric SVG illustrations do not satisfy the watercolor requirement; SVG is appropriate for diagrams and navigation. Save actual painted image assets in the repository and verify their resolution, loading, and appearance in the finished pages.
- Build compact sticky navigation around an episode motif, using the material, emblem, and edge treatment. Chapter boundaries are the only major divisions. Avoid unrelated clock indices, aisle labels, and ornamental chapter counts.
- Use the shared `/episode-timeline.js` and `/episode-timeline.css` interaction, matching Disney: the pointer's position anywhere on the full proportional track determines the actual **h:mm:ss** shown in the popup, updating continuously on pointer movement. The popup also shows the chapter title and start/end range. Keyboard focus shows that chapter's verified start using the same popup; arrow keys and Home/End move focus, Enter/Space jump, and Escape dismisses. Track the reading position with a consistent clock, chapter readout, and cursor. Keep **Home** and the Chapters dropdown above the track.
- Fit every interval into the available width on desktop and mobile. No internal timeline scrollbars, hidden chapters, persistent captions, swipe prompts, or helper legends. Preserve time proportions even for short segments; the Chapters dropdown supplies practical touch targets. Clamp tooltips to the viewport and keep the dropdown above the track and tooltip. Do not mask a layout error with overflow clipping.
- Use one verified timing version for the cue set and endpoint. Do not mix current ad-edited timestamps with an original-upload duration. Put provenance and any cue-extent limitation in the source notes. Verify pointer movement at multiple positions within one chapter, both track ends, keyboard focus/jumps/dismissal, tooltip bounds, dropdown layering, and 320px layouts in a real browser.
- On mobile, stack diagrams and simplify navigation. Preserve readable type, keyboard access, touch targets, image descriptions, and reduced motion. Prevent horizontal overflow.

## Accuracy and delivery

- Verify consequential claims. Do not invent quotes, facts, precision, or timestamps. Label approximations, conceptual diagrams, and imagined artwork; distinguish revenue, profit, box office, and cash flow.
- Deliver full standalone HTML with **Home** linking to `/`. Link the episode attribution itself to the original source. External links must open a new tab with `target="_blank"` and `rel="noopener noreferrer"`; keep internal chapter links in the current tab. Keep assets embedded or root-relative; avoid a library wrapper.
- Add the catalog entry with `id`, `title`, `category`, `addedOn`, `releasedOn`, and `file`. Verify the original release date from Acquired. The build derives the library season from that date: January–August → **Spring [Year]**, September–December → **Fall [Year]**. This is the library's two-season convention, including older numbered seasons and summer episodes. Use the same label on the artifact cover. Keep source links and attribution in the artifact itself. Preserve the original creation (`addedOn`) date when revising. Check links, images, and interactions on desktop and mobile.

- Repository delivery includes committing the standalone HTML, catalog entries, shared typography, and referenced assets, then pushing to the agreed remote branch. A local workspace edit or a `dist/` build alone is not delivery.
