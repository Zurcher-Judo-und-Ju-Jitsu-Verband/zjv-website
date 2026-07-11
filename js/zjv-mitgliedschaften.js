// Custom element: <zjv-mitgliedschaften src="/zjv/mitgliedschaften/mitgliedschaften.json">
// Fetches the mitgliedschaften.json data file and renders a logo list.

import { escapeHtml } from '/js/zjv-utils.js?v=1783711852';

class ZjvMitgliedschaften extends HTMLElement {
    async connectedCallback() {
        const src = this.getAttribute('src');
        if (!src) return;

        let data;
        try {
            const res = await fetch(src);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.json();
        } catch {
            this.innerHTML = '<p class="mitgliedschaften-error">Daten konnten nicht geladen werden.</p>';
            return;
        }

        const basePath = src.substring(0, src.lastIndexOf('/'));
        const items = data.mitgliedschaften ?? [];
        this.innerHTML = `<ul class="mitgliedschaften-list">${items.map(m => `
            <li class="mitgliedschaften-item">
                <a href="${escapeHtml(m.url)}" target="_blank" rel="noopener" title="${escapeHtml(m.name)}">
                    <img src="${escapeHtml(basePath + '/' + m.logo)}" alt="${escapeHtml(m.name)}">
                </a>
            </li>`).join('')}</ul>`;
    }
}

customElements.define('zjv-mitgliedschaften', ZjvMitgliedschaften);
