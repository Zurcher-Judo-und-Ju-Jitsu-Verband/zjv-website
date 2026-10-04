// Custom elements: <zjv-previews> and <zjv-source>
//
// Compact counterpart to <zjv-articles>/<zjv-article>: instead of rendering
// full article bodies, <zjv-previews> renders a wrapping grid of small
// <zjv-preview> teaser boxes (title + date only) that link out to the full
// article via its existing `?article=<slug>` deep link.
//
// <zjv-previews> collects <zjv-source> children (reuses the same markup as
// <zjv-articles>), fetches their articles.jsonl manifests in parallel,
// merges all entries by date (newest first), and applies not-before /
// not-after filtering - same logic as ZjvArticles, kept self-contained here
// since previews don't need lazy loading (teasers are cheap to render).
//
// Usage:
//   <zjv-previews heading-level="3">
//     <zjv-source src="news"></zjv-source>
//     <zjv-source src="kurse"></zjv-source>
//   </zjv-previews>

import '/js/zjv-preview.js?v=1791126413';

// --- ZjvSource ---
// Declarative source marker, shared with <zjv-articles>; only define it here
// if that module hasn't already (customElements.define() throws on reuse).

if (!customElements.get('zjv-source')) {
    customElements.define('zjv-source', class extends HTMLElement {});
}

// --- ZjvPreviews ---

class ZjvPreviews extends HTMLElement {
    async connectedCallback() {
        const headingLevel = Math.min(6, Math.max(1, parseInt(this.getAttribute('heading-level') || '2', 10)));
        const sources = Array.from(this.querySelectorAll('zjv-source'))
            .map(s => s.getAttribute('src'))
            .filter(Boolean);

        if (!sources.length) return;

        this.innerHTML = '<p class="previews-loading">Laden…</p>';

        const manifests = await Promise.all(sources.map(src => this._fetchManifest(src)));

        const today = new Date().toISOString().slice(0, 10);
        const entries = manifests
            .flat()
            .filter(entry => {
                if (entry['not-before'] && today < entry['not-before']) return false;
                if (entry['not-after'] && today > entry['not-after']) return false;
                return true;
            })
            .sort((a, b) => {
                const dateA = (a.fullSrc.match(/\/(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
                const dateB = (b.fullSrc.match(/\/(\d{4}-\d{2}-\d{2})/) || [])[1] || '';
                return dateB.localeCompare(dateA);
            });

        this.innerHTML = '';
        if (!entries.length) return;

        for (const entry of entries) {
            const preview = document.createElement('zjv-preview');
            preview.setAttribute('src', entry.fullSrc);
            preview.setAttribute('href', `/${entry.source}/index.html?article=${encodeURIComponent(entry.src)}`);
            preview.setAttribute('heading-level', String(headingLevel));
            this.appendChild(preview);
        }
    }

    async _fetchManifest(src) {
        let text;
        try {
            const res = await fetch(`/${src}/articles.jsonl`);
            if (!res.ok) {
                console.warn(`zjv-previews: failed to load /${src}/articles.jsonl (HTTP ${res.status})`);
                this._appendError(`Inhalte konnten nicht geladen werden (${src}).`);
                return [];
            }
            text = await res.text();
        } catch (err) {
            console.warn(`zjv-previews: network error loading /${src}/articles.jsonl`, err);
            this._appendError(`Inhalte konnten nicht geladen werden (${src}).`);
            return [];
        }

        return text.trim().split('\n')
            .filter(line => line.trim())
            .flatMap(line => {
                try {
                    const entry = JSON.parse(line);
                    return [{ ...entry, fullSrc: `${src}/${entry.src}`, source: src }];
                } catch {
                    console.warn(`zjv-previews: skipping malformed line in ${src}/articles.jsonl:`, line);
                    return [];
                }
            });
    }

    _appendError(message) {
        const p = document.createElement('p');
        p.className = 'previews-error';
        p.textContent = message;
        this.appendChild(p);
    }
}

customElements.define('zjv-previews', ZjvPreviews);

