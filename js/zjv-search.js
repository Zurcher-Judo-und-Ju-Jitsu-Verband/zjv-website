import { renderBody } from '/js/zjv-markdown.js?v=1783528006';

class ZjvSearch extends HTMLElement {
    connectedCallback() {
        if (this._panel) return;
        this._sources = Array.from(this.querySelectorAll('zjv-source'), source => ({
            type: source.getAttribute('type'),
            src: source.getAttribute('src'),
            href: source.getAttribute('href')
        }));
        this._cache = new Map();
        this._revision = 0;
        this.innerHTML = `
            <label class="search-launcher search-label">
                <span class="search-icon" aria-hidden="true">&#128269;&#65038;</span>
                <input type="search" placeholder="Suchen" aria-label="Website durchsuchen" aria-haspopup="dialog" autocomplete="off">
            </label>
            <div class="search-inline"></div>
            <dialog class="search-dialog" aria-label="Website durchsuchen"></dialog>`;
        this._panel = document.createElement('div');
        this._panel.className = 'search-panel';
        this._panel.innerHTML = `
            <button class="search-close" type="button" aria-label="Suche schliessen" title="Suche schliessen"><span aria-hidden="true">&#215;</span></button>
            <form class="search-form" role="search">
                <label class="search-label">
                    <span class="search-icon" aria-hidden="true">&#128269;&#65038;</span>
                    <input type="search" name="q" placeholder="Suchen" aria-label="Website durchsuchen" minlength="3" autocomplete="off">
                </label>
                <button class="search-clear" type="button" aria-label="Suche leeren" title="Suche leeren" hidden><span aria-hidden="true">&#215;</span></button>
            </form>
            <p class="search-status" role="status" aria-live="polite"></p>
            <ol class="search-results"></ol>`;
        this._dialog = this.querySelector('dialog');
        this._input = this._panel.querySelector('input');
        this._clear = this._panel.querySelector('.search-clear');
        this._status = this._panel.querySelector('.search-status');
        this._results = this._panel.querySelector('ol');
        this._panel.querySelector('form').addEventListener('submit', event => {
            event.preventDefault();
            clearTimeout(this._timer);
            this._search();
        });
        this._input.addEventListener('input', () => {
            clearTimeout(this._timer);
            this._revision++;
            this._clear.hidden = !this._input.value.length;
            this._results.replaceChildren();
            this._status.textContent = '';
            if (this._input.value.trim().length >= 3) {
                this._timer = setTimeout(() => this._search(), 250);
            }
        });
        this._clear.addEventListener('click', () => {
            this._reset();
            this._input.focus();
        });
        this._launcher = this.querySelector('.search-launcher input');
        const openSearch = () => {
            if (this._closing || this._dialog.open) return;
            this._input.value = this._launcher.value;
            this._clear.hidden = !this._input.value.length;
            this._dialog.showModal();
            this._input.focus();
        };
        this._launcher.addEventListener('focus', openSearch);
        this._launcher.addEventListener('click', openSearch);
        this._launcher.addEventListener('input', () => {
            openSearch();
            this._input.value = this._launcher.value;
            this._input.dispatchEvent(new Event('input'));
        });
        this._dialog.addEventListener('cancel', () => {
            this._closing = true;
            this._reset();
        });
        this._dialog.addEventListener('close', () => {
            this._launcher.value = this._input.value;
            this._closing = false;
        });
        this._panel.querySelector('.search-close').addEventListener('click', () => {
            this._closing = true;
            this._reset();
            this._dialog.close();
        });
        this._desktop = matchMedia('(min-width: 640px) and (hover: hover) and (pointer: fine)');
        this._layout = () => {
            this._launcher.value = this._input.value;
            this._clear.hidden = !this._input.value.length;
            if (this._dialog.open) {
                this._closing = true;
                this._dialog.close();
            }
            const host = this._desktop.matches ? this.querySelector('.search-inline') : this._dialog;
            host.appendChild(this._panel);
        };
        this._desktop.addEventListener('change', this._layout);
        this._layout();
    }

    _reset() {
        this._input.value = '';
        this._launcher.value = '';
        this._input.dispatchEvent(new Event('input'));
    }

    disconnectedCallback() {
        clearTimeout(this._timer);
        this._revision++;
        this._desktop?.removeEventListener('change', this._layout);
    }

    async _fetchText(url) {
        if (!this._cache.has(url)) {
            const pending = fetch(url).then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
                return response.text();
            }).catch(error => {
                this._cache.delete(url);
                throw error;
            });
            this._cache.set(url, pending);
        }
        return this._cache.get(url);
    }

    async _loadDocuments() {
        const candidates = [];
        let failed = false;
        await Promise.all(this._sources.map(async source => {
            try {
                if (!source.src) throw new Error('Missing search source');
                const base = new URL(source.src.replace(/\/$/, '') + '/', location.origin);
                if (source.type === 'articles') {
                    const manifest = await this._fetchText(new URL('articles.jsonl', base).href);
                    for (const line of manifest.split(/\r?\n/).filter(line => line.trim())) {
                        try {
                            const entry = JSON.parse(line);
                            if (!entry.src || !isVisible(entry)) continue;
                            const href = new URL(base);
                            href.searchParams.set('article', entry.src);
                            candidates.push({ src: new URL(`${entry.src}/article.md`, base).href, href: href.href });
                        } catch {
                            failed = true;
                        }
                    }
                } else if (source.type === 'markdown' && source.href) {
                    candidates.push({ src: new URL(source.src, location.origin).href,
                        href: new URL(source.href, location.origin).href });
                } else {
                    throw new Error('Invalid search source');
                }
            } catch (error) {
                failed = true;
                console.warn('zjv-search:', error);
            }
        }));
        const unique = new Map();
        for (const candidate of candidates) {
            const previous = unique.get(candidate.src);
            if (!previous || new URL(candidate.href).pathname.split('/').length >
                new URL(previous.href).pathname.split('/').length) unique.set(candidate.src, candidate);
        }
        const queue = Array.from(unique.values()).values();
        const documents = [];
        await Promise.all(Array.from({ length: 4 }, async () => {
            for (const candidate of queue) {
                try {
                    const markdown = await this._fetchText(candidate.src);
                    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
                    const meta = {};
                    for (const line of (match?.[1] || '').split(/\r?\n/)) {
                        const colon = line.indexOf(':');
                        if (colon !== -1) meta[line.slice(0, colon).trim()] =
                            line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
                    }
                    if (!isVisible(meta)) continue;
                    const template = document.createElement('template');
                    template.innerHTML = renderBody(match ? match[2] : markdown, '', 1);
                    template.content.querySelectorAll('figure').forEach(figure => figure.remove());
                    const text = template.content.textContent.replace(/\s+/g, ' ').trim();
                    const title = meta.title || template.content.querySelector('h1, h2')?.textContent ||
                        new URL(candidate.href).pathname;
                    documents.push({ ...candidate, title, text, date: meta.date || '' });
                } catch (error) {
                    failed = true;
                    console.warn('zjv-search:', error);
                }
            }
        }));
        return { documents, failed };
    }

    async _search() {
        const query = this._input.value.trim();
        if (query.length < 3) return;
        const terms = normalize(query).split(/\s+/).filter(Boolean);
        if (!terms.length) return;
        const revision = ++this._revision;
        this._status.textContent = 'Suche läuft…';
        this._results.replaceChildren();
        this._documents ||= this._loadDocuments();
        const pending = this._documents;
        const { documents, failed } = await pending;
        if (failed && this._documents === pending) this._documents = undefined;
        if (revision !== this._revision) return;
        const limit = Math.max(1, Math.min(20, parseInt(this.getAttribute('max-results'), 10) || 5));
        const hits = documents.flatMap(entry => {
            const title = normalize(entry.title);
            const body = normalize(entry.text);
            if (!terms.every(term => title.includes(term) || body.includes(term))) return [];
            const score = terms.reduce((total, term) => total + (title.includes(term) ? 10 : 1), 0) +
                (title.includes(normalize(query)) ? 20 : 0);
            return [{ ...entry, score }];
        }).sort((first, second) => second.score - first.score || second.date.localeCompare(first.date) ||
            first.title.localeCompare(second.title, 'de')).slice(0, limit);
        for (const hit of hits) {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = hit.href;
            const title = document.createElement('strong');
            title.textContent = hit.title;
            const context = document.createElement('small');
            context.textContent = new URL(hit.href).pathname.split('/').filter(Boolean).join(' / ');
            const excerpt = document.createElement('span');
            const position = normalize(hit.text).indexOf(terms[0]);
            const start = Math.max(0, position - 45);
            excerpt.textContent = (start ? '…' : '') + hit.text.slice(start, start + 180) +
                (hit.text.length > start + 180 ? '…' : '');
            link.append(title, context, excerpt);
            item.appendChild(link);
            this._results.appendChild(item);
        }
        this._status.textContent = (hits.length ? `${hits.length} Treffer` : 'Keine Treffer') +
            (failed ? ' – Einige Inhalte konnten nicht geladen werden. Bitte erneut suchen.' : '');
    }
}

function normalize(text) {
    return text.toLocaleLowerCase('de').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss');
}

function isVisible(meta) {
    const today = new Date().toISOString().slice(0, 10);
    return (!meta['not-before'] || today >= meta['not-before']) &&
        (!meta['not-after'] || today <= meta['not-after']);
}

customElements.define('zjv-search', ZjvSearch);