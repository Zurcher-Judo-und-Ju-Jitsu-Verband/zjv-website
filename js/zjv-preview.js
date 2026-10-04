// Custom element: <zjv-preview src="news/slug" href="/news/index.html?article=slug" heading-level="2">
//
// Compact counterpart to <zjv-article>: fetches only the frontmatter
// (title, date) of the article's article.md, plus a regex scan for the first
// image and first paragraph (no full markdown body rendering), and renders a
// small teaser box linking out to the full article.

import { escapeHtml } from '/js/zjv-markdown.js?v=1783528006';

class ZjvPreview extends HTMLElement {
    connectedCallback() {
        const src = this.getAttribute('src');
        const href = this.getAttribute('href');
        if (!src || !href) return;
        const headingLevel = Math.min(6, Math.max(1, parseInt(this.getAttribute('heading-level') || '2', 10)));
        this._load(src.replace(/\/$/, ''), href, headingLevel);
    }

    async _load(src, href, headingLevel) {
        const basePath = src.startsWith('/') ? src : '/' + src;
        let text;
        try {
            const res = await fetch(`${basePath}/article.md`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            text = await res.text();
        } catch {
            this.innerHTML = '<p class="preview-error">Teaser konnte nicht geladen werden.</p>';
            return;
        }

        const meta = parseFrontmatter(text);

        // not-before / not-after filtering (per-article, in addition to the manifest-level check)
        const today = new Date().toISOString().slice(0, 10);
        if (meta['not-before'] && today < meta['not-before']) return;
        if (meta['not-after'] && today > meta['not-after']) return;

        const titleTag = `h${headingLevel}`;
        const titleHtml = meta.title
            ? `<${titleTag} class="preview-title">${escapeHtml(meta.title)}</${titleTag}>`
            : '';
        const dateHtml = meta.date
            ? `<time class="preview-date" datetime="${escapeHtml(meta.date)}">${formatDate(meta.date)}</time>`
            : '';

        const imageSrc = findFirstImage(text, basePath);
        const imageHtml = imageSrc
            ? `<span class="preview-image" aria-hidden="true"><img src="${escapeHtml(imageSrc)}" alt="" loading="lazy"></span>`
            : '<span class="preview-image" aria-hidden="true"></span>';

        const excerpt = findFirstParagraph(text);
        const excerptHtml = excerpt
            ? `<p class="preview-excerpt">${escapeHtml(truncate(excerpt.text, 140, excerpt.hasMore))}</p>`
            : '';

        this.innerHTML = `<a class="zjv-preview-link" href="${escapeHtml(href)}">${imageHtml}${titleHtml}${dateHtml}${excerptHtml}</a>`;
    }
}

// --- Date formatting ---

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return escapeHtml(dateStr);
    return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
}

// --- Frontmatter (metadata only, no body) ---

function parseFrontmatter(text) {
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!match) return {};
    const meta = {};
    for (const line of match[1].split(/\r?\n/)) {
        const colon = line.indexOf(':');
        if (colon === -1) continue;
        const key = line.slice(0, colon).trim();
        const val = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
        meta[key] = val;
    }
    return meta;
}

// --- First image (same syntax as zjv-markdown.js, but body is not otherwise rendered) ---

function findFirstImage(text, basePath) {
    const bodyMatch = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1] : text;
    const img = body.match(/^!\[([^\]]*)\]\((\S+)\s+"([^"]+)"\)\s*$/m);
    return img ? `${basePath}/${img[2]}` : undefined;
}

// --- First paragraph (plain text, markdown syntax stripped) ---

function findFirstParagraph(text) {
    const bodyMatch = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1] : text;
    const lines = body.split(/\r?\n/);
    const paraLines = [];
    let i = 0;
    for (; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        const isOther = trimmed === '' || trimmed === '---' ||
            /^#{1,6}\s/.test(trimmed) || /^!\[/.test(trimmed) ||
            /^-\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);
        if (isOther) {
            if (paraLines.length) break;
            continue;
        }
        paraLines.push(trimmed);
    }
    if (!paraLines.length) return undefined;
    // more content (another block) follows the paragraph just collected?
    const hasMore = lines.slice(i).some(l => l.trim() !== '');
    const plainText = paraLines.join(' ')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/<br>/g, ' ')
        .trim();
    return { text: plainText, hasMore };
}

function truncate(str, maxLen, forceEllipsis) {
    if (str.length <= maxLen) return forceEllipsis ? `${str}\u2026` : str;
    const cut = str.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

customElements.define('zjv-preview', ZjvPreview);
