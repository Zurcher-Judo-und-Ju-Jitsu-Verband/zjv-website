// Custom elements: <zjv-articles> and <zjv-source>
//
// <zjv-articles> collects <zjv-source> children, fetches their articles.jsonl
// manifests in parallel, merges all entries by date (newest first), applies
// not-before / not-after filtering, and renders a <zjv-article> per entry.
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

        // Replace children with rendered articles
        this.innerHTML = '';
        for (const entry of entries) {
            const article = document.createElement('zjv-article');
            article.setAttribute('src', entry.fullSrc);
            article.setAttribute('heading-level', String(headingLevel));
            this.appendChild(article);
        }
    }

    async _fetchManifest(src) {
        try {
            const res = await fetch(`/${src}/articles.jsonl`);
            if (!res.ok) return [];
            const text = await res.text();
            return text.trim().split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const entry = JSON.parse(line);
                    return { ...entry, fullSrc: `${src}/${entry.src}` };
                });
        } catch {
            return [];
        }
    }
}

customElements.define('zjv-source', ZjvSource);
customElements.define('zjv-articles', ZjvArticles);
