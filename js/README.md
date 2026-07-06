# JavaScript

Client-side JavaScript for the ZJV website. All files are plain ES modules, no build step required.

## Custom Elements

| File | Element | Description |
|------|---------|-------------|
| `zjv-article.js` | `<zjv-article>` | Fetches and renders a single article from its `article.md` |
| `zjv-articles.js` | `<zjv-articles>` | Discovers and renders a list of articles from a JSONL index, with lazy loading and query param routing |

## Usage

Include the relevant script(s) in any page that uses the custom elements:

```html
<script type="module" src="/js/zjv-article.js"></script>
<script type="module" src="/js/zjv-articles.js"></script>
```

`zjv-articles.js` imports `zjv-article.js` internally, so pages using only `<zjv-articles>` need only include that one script.

## zjv-article

```html
<zjv-article src="news/2026-06-08_carmen-brussig-astana-2026" heading-level="1"></zjv-article>
```

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `src` | yes | — | Path to the article folder (relative to site root) |
| `heading-level` | no | `1` | Base heading level: `1` for standalone, `2` when embedded in a listing |

## zjv-articles

```html
<zjv-articles from="news/articles.jsonl" max="3"></zjv-articles>
```

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `from` | yes | — | Path to the JSONL index file listing article folder names |
| `max` | no | unlimited | Maximum number of articles to render |

Handles:
- Lazy loading via Intersection Observer (articles load as user scrolls)
- Query param routing: `?article=<folder-name>` renders only that article at `heading-level="1"`
- `not-before` / `not-after` frontmatter date filtering
- Automatically sets `heading-level="2"` on all child `<zjv-article>` elements
