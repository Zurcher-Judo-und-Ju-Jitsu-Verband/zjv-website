# ZJV Website

Maintainer documentation for the ZJV website.

## Project

- **Organisation:** [Zurcher-Judo-und-Ju-Jitsu-Verband](https://github.com/Zurcher-Judo-und-Ju-Jitsu-Verband) on GitHub
- **Started by:** [@defaultbranch](https://github.com/defaultbranch)

## Documentation

Each section of the site has its own `README.md` with details specific to that section. Keep this top-level README lean — put section-specific information in the appropriate subfolder README instead.

| Section | README |
|---------|--------|
| News | [news/README.md](news/README.md) |
| Kurse | [kurse/README.md](kurse/README.md) |
| JavaScript | [js/README.md](js/README.md) |

## Overview

This is the source for the ZJV website — the homepage of the cantonal Judo federation Zurich (Zürcher Judo Verband). The site is in German, with occasional English terms. It is a self-contained site with no external frameworks. Content is served as-is, with optional server-side rendering via PHP where needed.

## Technology

- **HTML** — page structure
- **CSS** — styling
- **JavaScript** — client-side interactivity
- **Markdown** — content files
- **PHP** — server-side rendering (where applicable)
- **Media** — static files and videos

## Folder Structure

The folder structure mirrors the site structure. Each directory corresponds to a section or page of the site.

The structure below reflects the original Joomla-based site. We aim to preserve the content and navigation where reasonable, but some sections may be restructured, merged, or dropped during the rebuild.

| Folder | Section |
|--------|---------|
| `/` | Home (landing page, links to news) |
| `/news/` | News |
| `/kurse/` | Kurse (Courses) |
| `/leistungssport/` | Leistungssport (Competitive sport) |
| `/nachwuchsturnier/` | Nachwuchsturnier (Youth tournament) |
| `/zjv/` | ZJV (About us) |
| `/jobs/` | Jobs |

## Pending Tasks

See [TODO.md](TODO.md) for pending tasks and improvements.

## Design

CSS custom properties are defined in `style.css`.

| Token | Value | Usage |
|-------|-------|-------|
| `--font-primary` | `Arial, sans-serif` | Body font |
| `--color-primary` | `#009ddc` | ZJV brand blue, CTAs |
| `--color-primary-hover` | `#007db0` | Darker brand blue, used on hover |
| `--color-background` | `#f5f5f5` | Page background |
| `--color-text` | `#333` | Body text |

### Constraints

- **Responsive** — the site must render well on both desktop and mobile. Use CSS with responsive breakpoints; the viewport meta tag is set in all pages.
- **Lazy loading** — pages with article lists (e.g. News) must load additional articles incrementally as the user scrolls, using the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). No full page reloads for pagination.

## Coding

### Cache Busting

All `<link>` and `<script>` tags referencing `style.css` or JS files include a `?v=<timestamp>` query parameter to force browsers to fetch updated versions. When modifying a CSS or JS file, update the version parameter in all HTML files that reference it:

```bash
date +%s
```

Replace the existing `?v=...` value with the new timestamp.

## Deployment

### Dev/Test Environment

- **URL:** http://zurcherj.myhostpoint.ch/ (no TLS)
- **Host:** `sl42.web.hostpoint.ch`
- **User:** `zurcherj`

Deploy with:

```bash
rsync -av --exclude-from=.rsyncignore . zurcherj@sl42.web.hostpoint.ch:~/www/zurcherj.myhostpoint.ch/
```

See `.rsyncignore` for excluded files. A Copilot skill (`/deploy-test`) is available to assist with this.

## Guidelines

- Do not introduce external frameworks or package managers.
- Keep the site self-contained — all dependencies should be vendored locally if needed.
- PHP files handle server-side logic only where HTML alone is insufficient.
- Markdown files are used for maintainable text content and are not directly web-accessible (see `.htaccess`).
- `.htaccess` files are used throughout the site to define access restrictions and rewrite rules per directory. They are blocked from client access at the root level.
- **No cookies** — the site must remain cookie-free. Do not introduce analytics, tracking, marketing scripts, or anything that sets cookies. This avoids the need for a cookie consent banner under GDPR. If a technical cookie becomes unavoidable (e.g. for a server-side form), document it explicitly.

## Editorial Content

### Article Preview Images

Preview images embedded in articles should measure **400px on the long edge**. Use the full-size image as source:

```bash
convert original.jpg -resize 400x400 original_preview.jpg
```

### Article Format

Articles are written in a subset of Markdown. Only the following features are supported:

**Paragraphs** — separate paragraphs with a blank line.

**Bold** — wrap text in `**double asterisks**`.

**Section headings** — use `##` (two hashes) for headings within an article. No other heading levels.

**Bullet lists** — use `- ` (dash and space) at the start of a line. Items must begin at the first column. Only one level of nesting. Consecutive items form a single list; a blank line ends the list.

**Horizontal rule** — use `---` on its own line to insert a visual divider.

**Links** — use `[link text](url)` inline within a paragraph. The URL can be an external address (`https://...`) or a local file relative to the article folder (e.g. `report.pdf`). External links open in a new tab and are prefixed with a `➜` arrow. Local `.pdf` links open in the same tab and are prefixed with a small red `PDF` badge. Do not add these indicators manually.

**Images** — use the following syntax on its own line:

```
![Alt text](preview-filename "placement|full-filename")
```

| Part | Description |
|------|-------------|
| `Alt text` | Describes the image for accessibility |
| `preview-filename` | Filename of the preview image (400px long edge), relative to the article folder |
| `placement` | `left`, `right`, `center`, or `inline` |
| `full-filename` | Full-size image, PDF, or external URL, opened when the preview is clicked. Local files open in the same tab; external URLs open in a new tab. |

Example:

```
![Gruppenfoto](2025-09-gruppe_preview.jpg "center|2025-09-gruppe.jpg")
```

No other Markdown features are supported (no tables, no heading 1, no inline code, no nested lists).

