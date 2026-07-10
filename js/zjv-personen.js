// Custom element: <zjv-personen src="/zjv/personen/personen.json">
// Fetches the personen.json data file and renders a contact list.

import { escapeHtml } from '/js/zjv-utils.js?v=1783711852';

class ZjvPersonen extends HTMLElement {
    async connectedCallback() {
        const src = this.getAttribute('src');
        if (!src) return;

        let data;
        try {
            const res = await fetch(src);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.json();
        } catch {
            this.innerHTML = '<p class="personen-error">Daten konnten nicht geladen werden.</p>';
            return;
        }

        const items = data.personen ?? [];
        this.innerHTML = items.map(p => `
            <p class="personen-item">
                <strong class="personen-rolle">${escapeHtml(p.rolle)}</strong>
                <span class="personen-name">${escapeHtml(p.name)}</span>
                <a class="personen-email" href="mailto:${escapeHtml(p.email)}">${escapeHtml(p.email)}</a>
            </p>`).join('');
    }
}

customElements.define('zjv-personen', ZjvPersonen);
