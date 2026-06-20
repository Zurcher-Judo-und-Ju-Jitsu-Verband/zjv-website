# ZJV Website

Maintainer documentation for the ZJV website.

## Documentation

Each section of the site has its own `README.md` with details specific to that section. Keep this top-level README lean — put section-specific information in the appropriate subfolder README instead.

| Section | README |
|---------|--------|
| News | [news/README.md](news/README.md) |

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
| `--color-primary-hover` | `#007db0` | Button hover state |
| `--color-background` | `#f5f5f5` | Page background |
| `--color-text` | `#333` | Body text |

### Constraints

- **Responsive** — the site must render well on both desktop and mobile. Use CSS with responsive breakpoints; the viewport meta tag is set in all pages.
- **Lazy loading** — pages with article lists (e.g. News) must load additional articles incrementally as the user scrolls, using the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). No full page reloads for pagination.

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
