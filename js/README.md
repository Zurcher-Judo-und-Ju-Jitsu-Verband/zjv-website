# JavaScript

Client-side JavaScript for the ZJV website. All files are plain ES modules, no build step required.

## Custom Elements

| File | Element | Description |
|------|---------|-------------|
| `zjv-utils.js` | — | Shared utility functions (no custom element; imported by other modules) |
| `zjv-markdown.js` | — | Pure markdown-to-HTML renderer (no custom element; imported by `zjv-article.js`) |
| `zjv-article.js` | `<zjv-article>` | Fetches and renders a single article from its `article.md` |
| `zjv-articles.js` | `<zjv-articles>`, `<zjv-source>` | Collects one or more article sources, merges by date, and renders with lazy loading |
| `zjv-personen.js` | `<zjv-personen>` | Fetches and renders a contact list from a `personen.json` data file |
| `zjv-mitgliedschaften.js` | `<zjv-mitgliedschaften>` | Fetches and renders a logo list from a `mitgliedschaften.json` data file |
| `zjv-yt-gallery.js` | `<zjv-yt-gallery>`, `<zjv-yt-tile>` | YouTube video tile gallery with click-to-embed |

## Usage

Include the relevant script(s) in any page that uses the custom elements:

```html
<script type="module" src="/js/zjv-article.js"></script>
<script type="module" src="/js/zjv-articles.js"></script>
```

`zjv-articles.js` imports `zjv-article.js` internally, so pages using only `<zjv-articles>` need only include that one script.

## zjv-article

Fetches and renders a single article from a folder containing `article.md`.

```html
<zjv-article src="news/2026-06-08_carmen-brussig-astana-2026" heading-level="1"></zjv-article>
```

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `src` | yes | — | Path to the article folder (relative to site root) |
| `heading-level` | no | `1` | Base heading level for the article title |

## zjv-articles

Collects sources, merges all articles by date (newest first), and renders them with lazy loading.

Sources are declared as child elements: `<zjv-source>` for a JSONL manifest, or `<zjv-article>` for a singleton. The `heading-level` on `<zjv-articles>` is passed to all rendered articles.

```html
<zjv-articles heading-level="1">
  <zjv-source src="news"></zjv-source>
</zjv-articles>
```

```html
<zjv-articles heading-level="1">
  <zjv-source src="news"></zjv-source>
  <zjv-source src="kurse"></zjv-source>
</zjv-articles>
```

```html
<zjv-articles heading-level="1">
  <zjv-source src="news"></zjv-source>
  <zjv-article src="kurse/2026-01-01_confidence-coach"></zjv-article>
</zjv-articles>
```

### zjv-articles attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `heading-level` | no | `1` | Heading level passed to all rendered `<zjv-article>` elements |

### zjv-source attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `src` | yes | Section name (e.g. `news`, `kurse`); the element fetches `/{src}/articles.jsonl` |

### articles.jsonl format

One JSON object per line, ordered newest first. Only `src` is required; other fields are optional modifiers.

```jsonl
{"src": "2026-06-08_carmen-brussig-astana-2026"}
{"src": "2026-02-16_gebrauchte-judo-matten", "not-after": "2026-09-01"}
{"src": "2025-12-22_carmen-brussig-sao-paulo-2025"}
```

| Field | Description |
|-------|-------------|
| `src` | Article folder name (without section prefix) |
| `not-before` | ISO date — article is hidden before this date |
| `not-after` | ISO date — article is hidden after this date |

### Behaviour

- Articles load lazily via Intersection Observer as the user scrolls
- `not-before` / `not-after` filtering is applied before rendering
- Query param `?article=<folder-name>` renders only that article at `heading-level="1"`

## zjv-personen

Fetches and renders a contact list (name, role, e-mail) from a JSON data file.

```html
<zjv-personen src="/zjv/personen/personen.json"></zjv-personen>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `src` | yes | URL of the `personen.json` data file |

### personen.json format

```json
{
  "personen": [
    { "rolle": "Präsidentin", "name": "Mirjam Senn", "email": "mirjam.senn@zjv.ch" }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `rolle` | yes | Function or department of the person |
| `name` | yes | Full name |
| `email` | yes | E-mail address |

## zjv-mitgliedschaften

Fetches and renders a logo list from a JSON data file. Each logo links to the organisation's website.

```html
<zjv-mitgliedschaften src="/zjv/mitgliedschaften/mitgliedschaften.json"></zjv-mitgliedschaften>
```

| Attribute | Required | Description |
|-----------|----------|-------------|
| `src` | yes | URL of the `mitgliedschaften.json` data file |

### mitgliedschaften.json format

```json
{
  "mitgliedschaften": [
    { "name": "Schweizerischer Judo & Ju-Jitsu Verband (SJV)", "url": "https://www.sjv.ch/", "logo": "sjv.jpg" }
  ]
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Organisation name (used as `alt` and `title` text) |
| `url` | yes | Link target for the logo |
| `logo` | yes | Logo filename, relative to the data file's directory |

## zjv-utils

Shared utility module, imported by other JS files. Not a custom element.

| Export | Description |
|--------|-------------|
| `escapeHtml(str)` | Escapes `&`, `<`, `>`, `"` for safe HTML insertion |

