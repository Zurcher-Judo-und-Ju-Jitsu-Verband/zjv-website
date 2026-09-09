// Custom element: <zjv-splash>
// Shows a brief branded splash screen, then fades out and removes itself.

const HOLD_MS = 1200;

class ZjvSplash extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <img src="/zjv-logo.png" alt="ZJV Logo">
            <span class="zjv-splash-title">Zürcher Judo und Ju-Jitsu Verband</span>
            <div class="zjv-splash-dots"><span></span><span></span><span></span></div>`;

        setTimeout(() => {
            this.classList.add('is-hidden');
            this.addEventListener('transitionend', () => this.remove(), { once: true });
        }, HOLD_MS);
    }
}

customElements.define('zjv-splash', ZjvSplash);
