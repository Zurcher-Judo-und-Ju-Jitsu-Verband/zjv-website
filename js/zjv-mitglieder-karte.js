// Custom element: <zjv-mitglieder-karte src="/zjv/mitglieder/mitglieder.json">
// Zoomable club map: Swisstopo base image, SVG region overlay, clickable club markers.

import { slugify } from '/js/zjv-utils.js?v=1783867364';

// Bounding box — 10% relative padding on all sides of club extents
const LAT_MIN = 46.7075, LAT_MAX = 47.8000;
const LNG_MIN = 7.9541,  LNG_MAX = 10.0063;
const MAX_ZOOM = 20;

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
                <div class="karte-inner">
                    <img class="karte-base" src="/js/zjv-mitglieder-karte/map.png?v=1783958405" alt="Karte ZJV-Region">
                    <img class="karte-boundaries" src="/js/zjv-mitglieder-karte/boundaries.svg?v=1783958405" alt="">
                    ${markers}
                </div>
            </div>`;

        this._initInteraction();

        const updateActive = () => {
            const id = window.location.hash.slice(1);
            this.querySelectorAll('.karte-marker').forEach(el => {
                el.classList.toggle('karte-marker--active', el.getAttribute('href') === `#${id}`);
            });
        };
        updateActive();
        window.addEventListener('hashchange', updateActive);
    }

    _initInteraction() {
        const container = this.querySelector('.karte-container');
        const inner = this.querySelector('.karte-inner');
        let zoom = 1, tx = 0, ty = 0;

        const applyTransform = () => {
            inner.style.transform = `translate(${tx}px,${ty}px) scale(${zoom})`;
            container.style.setProperty('--karte-zoom', zoom);
        };

        const clampPan = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            tx = Math.max(w * (1 - zoom), Math.min(0, tx));
            ty = Math.max(h * (1 - zoom), Math.min(0, ty));
        };

        const zoomAt = (px, py, factor) => {
            const newZoom = Math.max(1, Math.min(MAX_ZOOM, zoom * factor));
            const ratio = newZoom / zoom;
            tx = px - ratio * (px - tx);
            ty = py - ratio * (py - ty);
            zoom = newZoom;
            clampPan();
            applyTransform();
            container.style.cursor = zoom > 1 ? 'grab' : '';
        };

        // Scroll wheel zoom
        container.addEventListener('wheel', e => {
            e.preventDefault();
            const rect = container.getBoundingClientRect();
            zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.15 : 1 / 1.15);
        }, { passive: false });

        // Mouse drag pan
        let dragging = false, dragX = 0, dragY = 0;
        container.addEventListener('mousedown', e => {
            if (zoom <= 1) return;
            dragging = true; dragX = e.clientX - tx; dragY = e.clientY - ty;
            container.style.cursor = 'grabbing';
            e.preventDefault();
        });
        window.addEventListener('mousemove', e => {
            if (!dragging) return;
            tx = e.clientX - dragX; ty = e.clientY - dragY;
            clampPan(); applyTransform();
        });
        window.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            container.style.cursor = zoom > 1 ? 'grab' : '';
        });

        // Touch: pinch zoom + drag pan + tap on markers
        let touches = {}, lastDist = null, lastMid = null;
        let tapTarget = null, tapStartX = 0, tapStartY = 0;

        container.addEventListener('touchstart', e => {
            for (const t of e.changedTouches) touches[t.identifier] = { x: t.clientX, y: t.clientY };
            if (Object.keys(touches).length === 1) {
                const t = e.changedTouches[0];
                tapTarget = t.target.closest('.karte-marker');
                tapStartX = t.clientX; tapStartY = t.clientY;
                lastMid = { x: t.clientX, y: t.clientY };
            } else {
                tapTarget = null;
                const [a, b] = Object.values(touches);
                lastDist = Math.hypot(b.x - a.x, b.y - a.y);
                lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
            }
            e.preventDefault();
        }, { passive: false });

        container.addEventListener('touchmove', e => {
            for (const t of e.changedTouches) touches[t.identifier] = { x: t.clientX, y: t.clientY };
            const pts = Object.values(touches);
            const rect = container.getBoundingClientRect();
            if (pts.length === 2) {
                tapTarget = null;
                const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
                const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
                if (lastDist) zoomAt(mid.x - rect.left, mid.y - rect.top, dist / lastDist);
                lastDist = dist; lastMid = mid;
            } else if (pts.length === 1 && zoom > 1) {
                const prev = lastMid || pts[0];
                tx += pts[0].x - prev.x; ty += pts[0].y - prev.y;
                clampPan(); applyTransform();
                lastMid = pts[0];
            }
            e.preventDefault();
        }, { passive: false });

        container.addEventListener('touchend', e => {
            // Tap detection: navigate if finger barely moved
            if (tapTarget && e.changedTouches.length === 1) {
                const t = e.changedTouches[0];
                if (Math.hypot(t.clientX - tapStartX, t.clientY - tapStartY) < 8) {
                    window.location.href = tapTarget.getAttribute('href');
                }
            }
            for (const t of e.changedTouches) delete touches[t.identifier];
            if (Object.keys(touches).length === 0) { lastDist = null; lastMid = null; tapTarget = null; }
        });
    }
}

customElements.define('zjv-mitglieder-karte', ZjvMitgliederKarte);

