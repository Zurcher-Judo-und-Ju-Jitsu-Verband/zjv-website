// Custom element: <zjv-main>
// Site layout shell. Inserts a shared site header before itself and footer after itself.

import '/js/zjv-mitgliedschaften.js?v=1783796821';

class ZjvMain extends HTMLElement {
    async connectedCallback() {
        this._insertFooter();
        await this._insertHeader();
    }

    _insertFooter() {
        const footer = document.createElement('footer');
        footer.className = 'site-footer';
        footer.innerHTML = `
            <div class="site-footer-inner">
                <div class="site-footer-memberships">
                    <span class="site-footer-label">Der ZJV ist Mitglied bei:</span>
                    <zjv-mitgliedschaften src="/zjv/mitgliedschaften/mitgliedschaften.json"></zjv-mitgliedschaften>
                </div>
                <nav class="site-footer-nav">
                    <a href="/impressum">Impressum</a> &middot;
                    <a href="/datenschutz">Datenschutzerklärung</a>.
                </nav>
            </div>`;
        this.insertAdjacentElement('afterend', footer);
    }

    async _insertHeader() {
        let navItems = [];
        try {
            const res = await fetch('/nav.json?v=1783857000');
            if (res.ok) ({ nav: navItems } = await res.json());
        } catch { /* render empty header on failure */ }

        const header = document.createElement('header');
        header.className = 'site-header';
        header.innerHTML = `
            <div class="site-header-inner">
                <a class="site-header-logo" href="/"><img src="/zjv-logo.png" alt="ZJV Logo"> ZJV</a>
                <button class="site-header-toggle" aria-label="Navigation öffnen" aria-expanded="false">&#9776;</button>
                <nav class="site-header-nav" aria-label="Hauptnavigation">
                    ${navItems.map(item => this._renderNavItem(item)).join('')}
                </nav>
            </div>`;

        header.querySelector('.site-header-toggle').addEventListener('click', () => {
            const open = header.classList.toggle('is-open');
            header.querySelector('.site-header-toggle').setAttribute('aria-expanded', open);
        });

        // Close nav when a link is clicked (mobile)
        header.querySelectorAll('.site-header-nav a').forEach(a => {
            a.addEventListener('click', () => header.classList.remove('is-open'));
        });

        // Mark active link
        const path = window.location.pathname.replace(/\/$/, '') || '/';
        header.querySelectorAll('.site-header-nav a').forEach(a => {
            const href = a.getAttribute('href').replace(/\/$/, '') || '/';
            if (href === path || (href !== '/' && path.startsWith(href))) {
                a.classList.add('active');
            }
        });

        this.insertAdjacentElement('beforebegin', header);
    }

    _renderNavItem(item) {
        if (!item.children?.length) {
            return `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`;
        }
        return `
            <div class="site-header-group">
                <a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>
                <div class="site-header-children">
                    ${item.children.map(child => this._renderNavItem(child)).join('')}
                </div>
            </div>`;
    }
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

customElements.define('zjv-main', ZjvMain);

