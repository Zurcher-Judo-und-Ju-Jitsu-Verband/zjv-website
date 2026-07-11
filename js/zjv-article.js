// Custom element: <zjv-article src="path/to/article-folder" heading-level="1">
// Fetches article.md from the given folder and renders it into the page.

import { renderBody, escapeHtml } from '/js/zjv-markdown.js?v=1783528006';

class ZjvArticle extends HTMLElement {
    connectedCallback() {
        const src = this.getAttribute('src');
        if (!src) return;
        const headingLevel = Math.min(6, Math.max(1, parseInt(this.getAttribute('heading-level') || '1', 10)));
        this._load(src.replace(/\/$/, ''), headingLevel);
    }

    async _load(src, headingLevel) {
        const basePath = src.startsWith('/') ? src : '/' + src;
        let text;
        try {
            const res = await fetch(`${basePath}/article.md`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            text = await res.text();
        } catch {
            this.innerHTML = '<p class="article-error">Artikel konnte nicht geladen werden.</p>';
            return;
        }

        const { meta, body } = parseFrontmatter(text);

        // not-before / not-after filtering
        const today = new Date().toISOString().slice(0, 10);
        if (meta['not-before'] && today < meta['not-before']) return;
        if (meta['not-after'] && today > meta['not-after']) return;

        const titleTag = `h${headingLevel}`;
        const titleHtml = meta.title
            ? `<${titleTag} class="article-title">${escapeHtml(meta.title)}</${titleTag}>`
            : '';
        const dateHtml = meta.date
            ? `<time class="article-date" datetime="${escapeHtml(meta.date)}">veröffentlicht ${formatDate(meta.date)}</time>`
            : '';

        this.innerHTML = `<article class="zjv-article">${titleHtml}${renderBody(body, basePath, headingLevel)}${dateHtml}</article>`;
    }
}

// --- Date formatting ---

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return escapeHtml(dateStr);
    return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
}

// --- Frontmatter ---

function parseFrontmatter(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: text };
    const meta = {};
    for (const line of match[1].split(/\r?\n/)) {
        const colon = line.indexOf(':');
        if (colon === -1) continue;
        const key = line.slice(0, colon).trim();
        const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
        meta[key] = val;
    }
    return { meta, body: match[2] };
}

customElements.define('zjv-article', ZjvArticle);

