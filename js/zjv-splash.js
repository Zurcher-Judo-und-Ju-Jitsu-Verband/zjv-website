// Custom element: <zjv-splash>
// Shows a brief branded splash screen, then fades out and removes itself.

const HOLD_MS = 1500;

class ZjvSplash extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <img src="/zjv-logo.png" alt="ZJV Logo">
            <span>Zürcher Judo und Ju-Jitsu Verband</span>`;

        setTimeout(() => {
            this.classList.add('is-hidden');
            this.addEventListener('transitionend', () => this.remove(), { once: true });
        }, HOLD_MS);
    }
}

customElements.define('zjv-splash', ZjvSplash);
