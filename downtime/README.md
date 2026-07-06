# downtime

Downtime page shown to visitors while the site is under maintenance.

## How it works

- `index.html` — the page served during downtime
- The root `.htaccess` rewrites all requests to this page

## Enabling / disabling

To **enable** downtime: ensure the `RewriteEngine` block is present in the root `.htaccess`.

To **disable** downtime: remove or comment out the `RewriteEngine On` / `RewriteCond` / `RewriteRule` lines in the root `.htaccess`.
