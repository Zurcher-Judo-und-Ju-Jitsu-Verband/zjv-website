# downtime

Downtime page shown to visitors while the site is under maintenance.

## How it works

- `index.html` — the page served during downtime
- The root `.htaccess` rewrites all requests to this page

## Enabling / disabling

To **enable** downtime: ensure the `RewriteEngine` block is present in the root `.htaccess`.

To **disable** downtime: remove or comment out the `RewriteEngine On` / `RewriteCond` / `RewriteRule` lines in the root `.htaccess`.

## Content

The page shows the ZJV logo, a short maintenance message, and a row of YouTube video tiles.

### YouTube tiles

- Clicking a tile replaces the entire tile row with an inline YouTube embed (autoplay via `?autoplay=1` in the embed URL).
- The browser's back button and a "← Zurück" link both restore the tile view, using `history.pushState` / `popstate`.
- Thumbnails use `https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg` — no local image file needed.
- For older entries, local JPEG thumbnails are used (`/downtime/*.jpg`).

### Adding a new video

Add an `<a>` block inside `.downtime-videos` in `index.html`:

```html
<a href="https://www.youtube.com/watch?v=VIDEO_ID" data-ytid="VIDEO_ID" title="Caption">
    <img src="https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg" alt="Caption">
    <span class="caption">Caption</span>
</a>
```

### Why not embed iframes directly?

YouTube's `&autoplay=1` parameter on watch URLs is stripped by YouTube's own redirect. Embedding via `youtube.com/embed/ID?autoplay=1` in an iframe is the only reliable way to autoplay. The tile-click approach keeps the page clean until the visitor actively chooses to watch.
