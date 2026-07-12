// Markdown renderer (subset) for ZJV articles.
// Accepts a markdown body string (frontmatter already stripped) and returns HTML.
//
// CONTRACT: this module emits only semantic HTML and zjv-md-* CSS classes.
// Never use component-specific classes (e.g. zjv-article, article-*).

import { escapeHtml } from '/js/zjv-utils.js?v=1783711852';
export { escapeHtml };
// Consumers are responsible for their own styling via scoped selectors.
//
// Supported syntax:
//   ## heading          → <h{n}>
//   - item              → <ul><li>
//   ---                 → <hr>
//   ![alt](src "placement|fullsize")  → <figure class="zjv-md-img-{placement}">
//   [text](url)         → <a>
//   **text**            → <strong>
//   plain text          → <p>

export function renderBody(text, basePath, headingLevel) {
    const lines = text.split(/\r?\n/);
    const blocks = [];
    let paraLines = [];
    let listItems = [];
    let orderedItems = [];

    const flushPara = () => {
        if (!paraLines.length) return;
        const content = paraLines.join(' ').trim();
        if (content) blocks.push(`<p>${renderInline(content, basePath)}</p>`);
        paraLines = [];
    };

    const flushList = () => {
        if (!listItems.length) return;
        blocks.push(`<ul>${listItems.map(item => `<li>${renderInline(item, basePath)}</li>`).join('')}</ul>`);
        listItems = [];
    };

    const flushOrderedList = () => {
        if (!orderedItems.length) return;
        blocks.push(`<ol>${orderedItems.map(item => `<li>${renderInline(item, basePath)}</li>`).join('')}</ol>`);
        orderedItems = [];
    };

    for (const line of lines) {
        // ## heading
        const h2 = line.match(/^##\s+(.*)/);
        if (h2) {
            flushPara();
            flushList();
            flushOrderedList();
            const tag = `h${Math.min(6, headingLevel + 1)}`;
            blocks.push(`<${tag}>${escapeHtml(h2[1].trim())}</${tag}>`);
            continue;
        }

        // image: ![alt](preview "placement|fullsize")
        const img = line.trim().match(/^!\[([^\]]*)\]\((\S+)\s+"([^"]+)"\)\s*$/);
        if (img) {
            flushPara();
            flushList();
            flushOrderedList();
            blocks.push(renderImage(img[1], img[2], img[3], basePath));
            continue;
        }

        // ordered list item: 1. text
        const oli = line.match(/^\d+\. (.*)/);
        if (oli) {
            flushPara();
            flushList();
            orderedItems.push(oli[1]);
            continue;
        }

        // list item: - text
        const li = line.match(/^- (.*)/);
        if (li) {
            flushPara();
            flushOrderedList();
            listItems.push(li[1]);
            continue;
        }

        // horizontal rule: ---
        if (line.trim() === '---') {
            flushPara();
            flushList();
            flushOrderedList();
            blocks.push('<hr>');
            continue;
        }

        // blank line → paragraph break
        if (line.trim() === '') {
            flushPara();
            flushList();
            flushOrderedList();
        } else {
            paraLines.push(line);
        }
    }
    flushPara();
    flushList();
    flushOrderedList();

    return blocks.join('\n');
}

function renderInline(text, basePath) {
    // Single-pass tokenizer: <br>, links [text](url) and bold **text**
    const pattern = /<br>|(?<!!)\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
    const result = [];
    let last = 0;
    let m;
    while ((m = pattern.exec(text)) !== null) {
        if (m.index > last) result.push(escapeHtml(text.slice(last, m.index)));
        if (m[0] === '<br>') {
            result.push('<br>');
        } else if (m[1] !== undefined) {
            const url = m[2].trim();
            const isExternal = url.startsWith('http');
            const isAbsolute = url.startsWith('/');
            const resolvedUrl = (isExternal || isAbsolute) ? url : `${basePath}/${url}`;
            const attrs = isExternal ? ' target="_blank" rel="noopener"' : '';
            result.push(`<a href="${escapeHtml(resolvedUrl)}"${attrs}>${escapeHtml(m[1])}</a>`);
        } else {
            result.push(`<strong>${escapeHtml(m[3])}</strong>`);
        }
        last = m.index + m[0].length;
    }
    if (last < text.length) result.push(escapeHtml(text.slice(last)));
    return result.join('');
}

function renderImage(alt, preview, title, basePath) {
    const [placement, fullsize] = title.split('|').map(s => s.trim());
    const previewSrc = `${basePath}/${preview}`;
    const fullSrc = fullsize
        ? (fullsize.startsWith('http') ? fullsize : `${basePath}/${fullsize}`)
        : previewSrc;
    const cssClass = `zjv-md-img-${placement || 'center'}`;
    const isExternal = fullSrc.startsWith('http');
    const linkAttrs = isExternal ? ' target="_blank" rel="noopener"' : '';
    return `<figure class="${cssClass}">` +
        `<a href="${fullSrc}"${linkAttrs}>` +
        `<img src="${previewSrc}" alt="${escapeHtml(alt)}" loading="lazy">` +
        `</a></figure>`;
}


