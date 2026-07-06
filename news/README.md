# News

This folder contains the news section of the ZJV website.

## Structure

- `index.html` — news listing page (lazy-loads articles as user scrolls)
- `YYYY-MM-DD_<slug>/` — one folder per article, prefixed with the publication date
  - `index.html` — the article page
  - `<name>.jpeg` — full-size images
  - `<name>_preview.jpeg` — preview/thumbnail images

## Adding an Article

1. Create a new folder under `news/` named `YYYY-MM-DD_<slug>` (e.g. `2026-05-12_astana-2026/`).
2. Add an `article.md` with the article content (see format below).
3. Place full-size and preview images directly in the same folder.
4. The article will be picked up by the news listing page.

## Article Format (`article.md`)

Each article is a Markdown file with a YAML frontmatter block followed by the article body.

### Frontmatter

```yaml
---
title: "Full article title"
date: YYYY-MM-DD
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | yes | Full article title, shown as the page heading |
| `date` | yes | Publication date in ISO format (`YYYY-MM-DD`) |
| `not-before` | no | Do not display the article before this date (`YYYY-MM-DD`) |
| `not-after` | no | Do not display the article after this date (`YYYY-MM-DD`) |

### Supported Markdown

| Feature | Syntax | Notes |
|---------|--------|-------|
| Paragraph | blank line between text | — |
| Bold | `**text**` | — |
| Heading 2 | `## Heading` | Use for section headings within an article |
| List | `- item` | One level only; items must start at beginning of line |
| Link | `[text](https://...)` | External links only; open in new tab; `➜` prefix added automatically for text links in paragraphs |
| Horizontal rule | `---` | Visual divider |
| Image | see below | Extended syntax for placement and full-size link |

No other Markdown features are supported (no tables, no heading 1, no inline code, no nested lists).

### Image Syntax

```markdown
![Alt text](preview.jpeg "placement|fullsize.jpeg")
```

The title attribute encodes two values separated by `|`:
- **placement**: `left`, `right`, `center`, or `inline`
- **fullsize**: filename of the full-size image (clicking the preview opens it)

| Placement | Behaviour |
|-----------|-----------|
| `left` | floats left, text wraps right |
| `right` | floats right, text wraps left |
| `center` | centered block, clears floats |
| `inline` | flows left-to-right with adjacent inline images (gallery style) |

**Example:**
```markdown
![Astana 2026 – Bild 1](2026-05-12_bild-1_preview.jpeg "left|2026-05-12_bild-1.jpeg")
```

### Rendering

Articles are rendered client-side via JavaScript using [marked.js](https://marked.js.org/) (vendored) with a custom image renderer that handles the placement/fullsize syntax. The article page (`index.html`) fetches `article.md` from the same folder and renders it into the page.
