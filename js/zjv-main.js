// Custom element: <zjv-main>
// Site layout shell. Inserts a shared site footer after itself in the DOM.

import '/js/zjv-mitgliedschaften.js?v=1783796821';

class ZjvMain extends HTMLElement {
    connectedCallback() {
        const footer = document.createElement('footer');
        footer.className = 'site-footer';
        footer.innerHTML = `
            <div class="site-footer-inner">
                <div class="site-footer-memberships">
                    <span class="site-footer-label">Der ZJV ist Mitglied bei:</span>
                    <zjv-mitgliedschaften src="/zjv/mitgliedschaften/mitgliedschaften.json"></zjv-mitgliedschaften>
                </div>
                <nav class="site-footer-nav">
                    Hier geht es zu unserer <a href="/datenschutz">Datenschutzerklärung</a>.
                </nav>
            </div>`;
        this.insertAdjacentElement('afterend', footer);
    }
}

customElements.define('zjv-main', ZjvMain);
