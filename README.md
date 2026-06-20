# ZJV Website

Maintainer documentation for the ZJV website.

## Overview

This is the source for the ZJV website. It is a self-contained site with no external frameworks. Content is served as-is, with optional server-side rendering via PHP where needed.

## Technology

- **HTML** — page structure
- **CSS** — styling
- **JavaScript** — client-side interactivity
- **Markdown** — content files
- **PHP** — server-side rendering (where applicable)
- **Media** — static files and videos

## Folder Structure

The folder structure mirrors the site structure. Each directory corresponds to a section or page of the site.

## Guidelines

- Do not introduce external frameworks or package managers.
- Keep the site self-contained — all dependencies should be vendored locally if needed.
- PHP files handle server-side logic only where HTML alone is insufficient.
- Markdown files are used for maintainable text content and are not directly web-accessible (see `.htaccess`).
- `.htaccess` files are used throughout the site to define access restrictions and rewrite rules per directory. They are blocked from client access at the root level.
