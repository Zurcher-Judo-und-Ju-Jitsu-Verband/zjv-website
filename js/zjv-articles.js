// Custom elements: <zjv-articles> and <zjv-source>
//
// <zjv-articles> collects <zjv-source> children, fetches their articles.jsonl
// manifests in parallel, merges all entries by date (newest first), applies
// not-before / not-after filtering, and renders a <zjv-article> per entry
// using lazy loading via Intersection Observer.
//
// Usage:
//   <zjv-articles heading-level="1">
//     <zjv-source src="news"></zjv-source>
//     <zjv-source src="kurse"></zjv-source>
//   </zjv-articles>

import '/js/zjv-article.js?v=1783366164';

// --- ZjvSource ---
// Declarative source marker; behaviour is handled by ZjvArticles.

class ZjvSource extends HTMLElement {}

// --- ZjvArticles ---

class ZjvArticles extends HTMLElement {
    async connectedCallback() {
        const headingLevel = Math.min(6, Math.max(1, parseInt(this.getAttribute('heading-level') || '1', 10)));
        const sources = Array.from(this.querySelectorAll('zjv-source'))
            .map(s => s.getAttribute('src'))
            .filter(Boolean);

        if (!sources.length) return;

        this.innerHTML = '<p class="articles-loading">Laden…</p>';

        // Fetch all manifests in parallel
        const manifests = await Promise.all(sources.map(src => this._fetchManifest(src)));

        // Flatten, filter by date, sort newest first
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

        // Lazy-load: append one article at a time, observe the last one,
        // append the next when it nears the viewport.
        let index = 0;
        const observer = new IntersectionObserver((entries_io) => {
            for (const io of entries_io) {
                if (!io.isIntersecting) continue;
                observer.unobserve(io.target);
                if (index < entries.length) this._appendNext(entries, index++, observer, headingLevel);
            }
        }, { rootMargin: '300px' });

        this._appendNext(entries, index++, observer, headingLevel);
    }

    _appendNext(entries, i, observer, headingLevel) {
        const article = document.createElement('zjv-article');
        article.setAttribute('src', entries[i].fullSrc);
        article.setAttribute('heading-level', String(headingLevel));
        this.appendChild(article);
        if (i + 1 < entries.length) observer.observe(article);
    }

    async _fetchManifest(src) {
        let text;
        try {
            const res = await fetch(`/${src}/articles.jsonl`);
            if (!res.ok) {
                console.warn(`zjv-articles: failed to load /${src}/articles.jsonl (HTTP ${res.status})`);
                this._appendError(`Inhalte konnten nicht geladen werden (${src}).`);
                return [];
            }
            text = await res.text();
        } catch (err) {
            console.warn(`zjv-articles: network error loading /${src}/articles.jsonl`, err);
            this._appendError(`Inhalte konnten nicht geladen werden (${src}).`);
            return [];
        }

        return text.trim().split('\n')
            .filter(line => line.trim())
            .flatMap(line => {
                try {
                    const entry = JSON.parse(line);
                    return [{ ...entry, fullSrc: `${src}/${entry.src}` }];
                } catch {
                    console.warn(`zjv-articles: skipping malformed line in ${src}/articles.jsonl:`, line);
                    return [];
                }
            });
    }

    _appendError(message) {
        const p = document.createElement('p');
        p.className = 'articles-error';
        p.textContent = message;
        this.appendChild(p);
    }
}

customElements.define('zjv-source', ZjvSource);
customElements.define('zjv-articles', ZjvArticles);

