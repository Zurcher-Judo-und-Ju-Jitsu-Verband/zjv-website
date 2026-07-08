// Custom elements: <zjv-yt-gallery> and <zjv-yt-tile>
//
// Usage:
//   <zjv-yt-gallery>
//     <zjv-yt-tile ytid="VIDEO_ID" caption="Title"></zjv-yt-tile>
//     <zjv-yt-tile ytid="VIDEO_ID" caption="Title" thumb="/path/to/thumb.jpg"></zjv-yt-tile>
//   </zjv-yt-gallery>
//
// Clicking a tile replaces the gallery with an autoplaying inline player.
// The browser back button and a "← Zurück" link both restore the tile view.

(function () {

    // Inject styles once into <head>
    if (!document.getElementById('zjv-yt-styles')) {
        const style = document.createElement('style');
        style.id = 'zjv-yt-styles';
        style.textContent = `
            zjv-yt-gallery {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                justify-content: center;
                padding: 0 1rem;
            }
            zjv-yt-tile {
                display: block;
                border-radius: 6px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transition: box-shadow 0.2s;
                cursor: pointer;
            }
            zjv-yt-tile:hover {
                box-shadow: 0 6px 18px rgba(0,0,0,0.35);
            }
            zjv-yt-tile img {
                display: block;
                width: 280px;
                height: auto;
            }
            .zjv-yt-caption {
                display: block;
                padding: 0.4rem 0.6rem;
                font-size: 0.85rem;
                color: var(--color-text);
                text-align: center;
                background: #fff;
            }
            .zjv-yt-player {
                width: 100%;
                max-width: 560px;
                border-radius: 6px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .zjv-yt-player-frame {
                position: relative;
                width: 100%;
                aspect-ratio: 16 / 9;
            }
            .zjv-yt-player-frame iframe {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                border: 0;
            }
            .zjv-yt-back {
                display: block;
                text-align: center;
                margin-top: 0.5rem;
                padding-bottom: 0.4rem;
                font-size: 0.85rem;
            }
        `;
        document.head.appendChild(style);
    }

    // --- ZjvYtTile ---

    class ZjvYtTile extends HTMLElement {
        connectedCallback() {
            const ytid = this.getAttribute('ytid');
            const caption = this.getAttribute('caption') || '';
            const thumb = this.getAttribute('thumb')
                || `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;
            this.innerHTML =
                `<img src="${escAttr(thumb)}" alt="${escAttr(caption)}">` +
                `<span class="zjv-yt-caption">${esc(caption)}</span>`;
            this.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('yt-tile-click', {
                    bubbles: true,
                    detail: { ytid, caption }
                }));
            });
        }
    }

    // --- ZjvYtGallery ---

    class ZjvYtGallery extends HTMLElement {
        connectedCallback() {
            // Read tile data from child elements before any modification
            this._tiles = Array.from(this.querySelectorAll('zjv-yt-tile')).map(t => ({
                ytid: t.getAttribute('ytid'),
                caption: t.getAttribute('caption') || '',
                thumb: t.getAttribute('thumb') || null
            }));

            this.addEventListener('yt-tile-click', (e) => {
                const { ytid, caption } = e.detail;
                history.pushState({ ytid, caption }, '');
                this._showPlayer(ytid, caption);
            });

            window.addEventListener('popstate', (e) => {
                if (e.state && e.state.ytid) {
                    this._showPlayer(e.state.ytid, e.state.caption);
                } else {
                    this._showTiles();
                }
            });
        }

        _showPlayer(ytid, caption) {
            this.style.display = 'block';
            this.style.width = '100%';
            this.style.maxWidth = '560px';
            this.innerHTML =
                `<div class="zjv-yt-player">` +
                `<div class="zjv-yt-player-frame">` +
                `<iframe src="https://www.youtube.com/embed/${escAttr(ytid)}?autoplay=1"` +
                ` allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"` +
                ` allowfullscreen></iframe>` +
                `</div>` +
                `<span class="zjv-yt-caption">${esc(caption)}</span>` +
                `<a href="#" class="zjv-yt-back" onclick="history.back();return false;">← Zurück</a>` +
                `</div>`;
        }

        _showTiles() {
            this.style.display = '';
            this.style.width = '';
            this.style.maxWidth = '';
            this.innerHTML = this._tiles.map(t =>
                `<zjv-yt-tile ytid="${escAttr(t.ytid)}" caption="${escAttr(t.caption)}"` +
                (t.thumb ? ` thumb="${escAttr(t.thumb)}"` : '') +
                `></zjv-yt-tile>`
            ).join('');
        }
    }

    // --- Helpers ---

    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function escAttr(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;');
    }

    customElements.define('zjv-yt-tile', ZjvYtTile);
    customElements.define('zjv-yt-gallery', ZjvYtGallery);

})();
