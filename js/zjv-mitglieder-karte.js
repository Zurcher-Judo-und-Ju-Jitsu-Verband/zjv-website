// Custom element: <zjv-mitglieder-karte src="/zjv/mitglieder/mitglieder.json">
// Renders a passive club map: Swisstopo base image, SVG region overlay, clickable club markers.

import { slugify } from '/js/zjv-utils.js?v=1783711852';

// Bounding box — 10% relative padding on all sides of club extents
const LAT_MIN = 46.97, LAT_MAX = 47.78;
const LNG_MIN = 8.00,  LNG_MAX = 9.55;

function project(lng, lat) {
    return {
        x: (lng - LNG_MIN) / (LNG_MAX - LNG_MIN) * 100,
        y: (LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * 100,
    };
}

class ZjvMitgliederKarte extends HTMLElement {
    async connectedCallback() {
        const src = this.getAttribute('src');
        if (!src) return;

        let data;
        try {
            const res = await fetch(src);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            data = await res.json();
        } catch {
            this.innerHTML = '<p class="karte-error">Kartendaten konnten nicht geladen werden.</p>';
            return;
        }

        const markers = data.mitglieder
            .filter(c => c.lat != null && c.lng != null)
            .map(c => {
                const { x, y } = project(c.lng, c.lat);
                const id = slugify(c.name);
                return `<a class="karte-marker" href="#${id}" title="${c.name.replace(/"/g, '&quot;')}" style="left:${x.toFixed(3)}%;top:${y.toFixed(3)}%"></a>`;
            }).join('');

        this.innerHTML = `
            <div class="karte-container">
                <img class="karte-base" src="/js/zjv-mitglieder-karte/map.png" alt="Karte ZJV-Region">
                <img class="karte-boundaries" src="/js/zjv-mitglieder-karte/boundaries.svg" alt="">
                ${markers}
            </div>`;
    }
}

customElements.define('zjv-mitglieder-karte', ZjvMitgliederKarte);
