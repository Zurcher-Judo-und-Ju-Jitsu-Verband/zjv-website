# Plan: Compact Frontpage Previews (`zjv-previews` / `zjv-preview`)

Experimental, discussed in `index-dev.html` — not linked from the official site yet.

## Goal

The frontpage currently uses `<zjv-articles>`, which renders every matching article in
full (via `<zjv-article>`), lazily loaded as the user scrolls. Users asked for a more
compact frontpage on desktop (mobile is fine as-is). Instead of feeding in full
articles, show abbreviated "boxes" (teasers) that link out to the full article.

This calls for new custom elements, tentatively `<zjv-previews>` (container, parallel to
`zjv-articles`) and `<zjv-preview>` (single teaser box, parallel to `zjv-article>`).

## Open Questions

- **Box size/density**: several small boxes side-by-side vs. fewer, larger,
  width-filling boxes?
- **Layout direction**: wrapping grid (boxes flow to next line) vs. horizontal
  side-scrolling row (one `<zjv-previews>` = one scrollable row, multiple instances
  stacked vertically, each scrollable independently)?
- **Content per box**: title + date only, or also an image/excerpt?

These are UX/design decisions best made by looking at real content once something is
on screen, not upfront.

## Reusable Facts

- `news/index.html` and `kurse/index.html` already support `focus-param="article"`,
  i.e. `?article=<slug>` deep-links to a single full article. A preview box can
  therefore just link to `/news/index.html?article=<slug>` (or `/kurse/...`) instead of
  rendering the article body itself.
- Manifest fetching/merging/filtering/sorting logic already exists in
  `zjv-articles.js` (`_fetchManifest`, date filtering, newest-first sort) and can be
  reused or extracted rather than reimplemented.
- Frontmatter (`title`, `date`, optional first image) is parsed today in
  `zjv-article.js` / `zjv-markdown.js`.

## MVP Options

### Option A — Minimal teaser grid (recommended starting point)

- `zjv-previews` reuses the existing manifest fetch/sort/filter logic.
- `zjv-preview` reads only frontmatter (title + date) — no markdown body parsing, no
  image extraction.
- Rendered as a plain CSS grid (`grid-template-columns: repeat(auto-fill, minmax(...))`)
  that wraps on narrow screens — sidesteps the side-scroll-vs-wrap question for now.
- Each box links to the source's `index.html?article=<slug>`.
- Pros: least code, defers the "how much content per box" question.
- Cons: very bare (title + date only); may be too plain to judge visually.

### Option B — Teaser with image + excerpt

- Same as A, but `zjv-preview` fetches `article.md` and extracts title, date, first
  image, and a truncated first paragraph.
- Still a wrapping grid, not a scroller.
- Pros: closer to the final look, gives a realistic compactness comparison against the
  current full-article feed.
- Cons: more parsing logic to share with `zjv-markdown.js`.

### Option C — Horizontal scroller skeleton

- Build the scroll-snap container first (`overflow-x: auto; scroll-snap-type: x
  mandatory`) with placeholder/dummy boxes, before wiring up real data.
- Pros: directly tests the open "stack rows, scroll horizontally within one row" UX
  question.
- Cons: doesn't validate content density at all; pure layout prototype.

## Recommendation

Start with **Option A**: cheapest way to get real content on `index-dev.html` next to
(or instead of) `zjv-articles`, lets layout (grid vs. scroll-row) be judged against real
article counts, and later steps (images/excerpts, horizontal scrolling) are additive
rather than a rewrite.
