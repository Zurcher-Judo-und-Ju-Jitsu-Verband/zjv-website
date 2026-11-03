const DESKTOP_QUERY = '(min-width: 640px) and (hover: hover) and (pointer: fine)';
const ROTATION_DELAY = 7000;

class ZjvPhotoCarousel extends HTMLElement {
    connectedCallback() {
        this._slides = Array.from(this.querySelectorAll(':scope > img[data-src]'));
        if (this._slides.length < 2) return;

        this._currentIndex = -1;
        this._loadPromises = new WeakMap();
        this._desktop = window.matchMedia(DESKTOP_QUERY);
        this._reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        this._desktop.addEventListener('change', () => this._handleDesktopChange());
        this._reducedMotion.addEventListener('change', event => {
            if (event.matches) clearTimeout(this._timer);
            else this._schedule();
        });

        if (this._desktop.matches) this._start();
    }

    _start() {
        const index = this._currentIndex < 0 ? 0 : this._currentIndex;
        this._showSlide(index).then(() => this._schedule());
    }

    async _showSlide(index) {
        if (!this._desktop.matches || !(await this._loadSlide(index)) || !this._desktop.matches) return false;

        this._slides.forEach((slide, slideIndex) => {
            slide.classList.toggle('is-active', slideIndex === index);
            slide.setAttribute('aria-hidden', slideIndex === index ? 'false' : 'true');
        });
        this._currentIndex = index;
        if (!this._reducedMotion.matches) {
            this._loadSlide((index + 1) % this._slides.length);
        }
        return true;
    }

    _loadSlide(index) {
        const image = this._slides[index];
        if (image.hasAttribute('src') && image.complete) {
            return Promise.resolve(image.naturalWidth > 0);
        }

        const existingPromise = this._loadPromises.get(image);
        if (existingPromise) return existingPromise;

        const promise = new Promise(resolve => {
            image.addEventListener('load', async () => {
                try {
                    await image.decode();
                } catch {
                    // A loaded image remains usable if decode() is unavailable.
                }
                resolve(image.naturalWidth > 0);
            }, { once: true });
            image.addEventListener('error', () => resolve(false), { once: true });
            image.decoding = 'async';
            image.fetchPriority = 'low';
            image.src = image.dataset.src;
        });
        this._loadPromises.set(image, promise);
        return promise;
    }

    async _advance() {
        const nextIndex = (this._currentIndex + 1) % this._slides.length;
        await this._showSlide(nextIndex);
        this._schedule();
    }

    _schedule() {
        clearTimeout(this._timer);
        if (this._reducedMotion.matches || !this._desktop.matches) return;
        this._timer = setTimeout(() => this._advance(), ROTATION_DELAY);
    }

    _handleDesktopChange() {
        clearTimeout(this._timer);
        if (this._desktop.matches) this._start();
    }
}

customElements.define('zjv-photo-carousel', ZjvPhotoCarousel);