// Custom element: <zjv-mitglieder-liste src="/zjv/mitglieder/mitglieder.json">
// Fetches mitglieder.json and renders clubs grouped by Bezirk/Kanton.

import { escapeHtml } from '/js/zjv-utils.js?v=1783711852';

function slugify(name) {
    return name.toLowerCase()
        .replace(/ü/g, 'ue').replace(/ö/g, 'oe').replace(/ä/g, 'ae').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

class ZjvMitgliederListe extends HTMLElement {
    async connectedCallback() {
        const src = this.getAttribute('src');
        if (!src) return;

        let data;
        try {
            const res = await fetch(src);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.json();
        } catch {
            this.innerHTML = '<p class="mitglieder-error">Mitgliederdaten konnten nicht geladen werden.</p>';
            return;
        }

        // Group by bezirk, preserving sort order from JSON
        const groups = new Map();
        for (const club of data.mitglieder) {
            if (!groups.has(club.bezirk)) groups.set(club.bezirk, []);
            groups.get(club.bezirk).push(club);
        }

        // Highlight club if URL fragment matches on load
        const highlight = () => {
            const id = window.location.hash.slice(1);
            this.querySelectorAll('.mitglieder-club').forEach(el => {
                el.classList.toggle('mitglieder-club--active', el.id === id);
            });
        };

        this.innerHTML = [...groups.entries()].map(([bezirk, clubs]) => `
            <section class="mitglieder-bezirk">
                <h2 class="mitglieder-bezirk-title">${escapeHtml(bezirk)}</h2>
                ${clubs.map(club => {
                    const id = slugify(club.name);
                    const addr = [club.adresse, `${club.plz} ${club.ort}`].filter(Boolean).join(', ');
                    const web = club.webseite
                        ? `<a class="mitglieder-club-webseite" href="${escapeHtml(club.webseite)}" target="_blank" rel="noopener">${escapeHtml(club.webseite.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>`
                        : '';
                    return `
                        <div class="mitglieder-club" id="${escapeHtml(id)}">
                            <strong class="mitglieder-club-name">${escapeHtml(club.name)}</strong>
                            <span class="mitglieder-club-adresse">${escapeHtml(addr)}</span>
                            ${web}
                        </div>`;
                }).join('')}
            </section>`).join('');

        highlight();
        window.addEventListener('hashchange', highlight);
    }
}

customElements.define('zjv-mitglieder-liste', ZjvMitgliederListe);
