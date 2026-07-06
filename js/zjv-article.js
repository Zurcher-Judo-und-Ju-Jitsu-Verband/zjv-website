// Custom element: <zjv-article src="path/to/article-folder" heading-level="1">
// Fetches article.md from the given folder and renders it into the page.

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

        this.innerHTML = `<article class="zjv-article">${titleHtml}${renderBody(body, basePath, headingLevel)}</article>`;
    }
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

// --- Markdown renderer (subset) ---

function renderBody(text, basePath, headingLevel) {
    const lines = text.split(/\r?\n/);
    const blocks = [];
    let paraLines = [];
    let listItems = [];

    const flushPara = () => {
        if (!paraLines.length) return;
        const content = paraLines.join(' ').trim();
        if (content) blocks.push(`<p>${renderInline(content)}</p>`);
        paraLines = [];
    };

    const flushList = () => {
        if (!listItems.length) return;
        blocks.push(`<ul>${listItems.map(item => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
        listItems = [];
    };

    for (const line of lines) {
        // ## heading
        const h2 = line.match(/^##\s+(.*)/);
        if (h2) {
            flushPara();
            flushList();
            const tag = `h${Math.min(6, headingLevel + 1)}`;
            blocks.push(`<${tag} class="article-heading">${escapeHtml(h2[1].trim())}</${tag}>`);
            continue;
        }

        // image: ![alt](preview "placement|fullsize")
        const img = line.trim().match(/^!\[([^\]]*)\]\((\S+)\s+"([^"]+)"\)\s*$/);
        if (img) {
            flushPara();
            flushList();
            blocks.push(renderImage(img[1], img[2], img[3], basePath));
            continue;
        }

        // list item: - text
        const li = line.match(/^- (.*)/);
        if (li) {
            flushPara();
            listItems.push(li[1]);
            continue;
        }

        // horizontal rule: ---
        if (line.trim() === '---') {
            flushPara();
            flushList();
            blocks.push('<hr class="article-rule">');
            continue;
        }

        // blank line → paragraph break
        if (line.trim() === '') {
            flushPara();
            flushList();
        } else {
            paraLines.push(line);
        }
    }
    flushPara();
    flushList();

    return blocks.join('\n');
}

function renderInline(text) {
    // Bold: split on **...**  then escape each segment
    return text
        .split(/\*\*([^*]+)\*\*/)
        .map((part, i) => i % 2 === 0 ? escapeHtml(part) : `<strong>${escapeHtml(part)}</strong>`)
        .join('');
}

function renderImage(alt, preview, title, basePath) {
    const [placement, fullsize] = title.split('|').map(s => s.trim());
    const previewSrc = `${basePath}/${preview}`;
    const fullSrc   = fullsize ? `${basePath}/${fullsize}` : previewSrc;
    const cssClass  = `img-${placement || 'center'}`;
    return `<figure class="${cssClass}">` +
        `<a href="${fullSrc}" target="_blank" rel="noopener">` +
        `<img src="${previewSrc}" alt="${escapeHtml(alt)}" loading="lazy">` +
        `</a></figure>`;
}

// --- Helpers ---

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

customElements.define('zjv-article', ZjvArticle);
