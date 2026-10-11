const ThemePreview = (() => {
    const STORAGE_KEY = 'quiz_visual_theme';
    const DEFAULT_THEME = 'maison';
    const themes = Object.freeze([
        { id: 'maison', label: 'Maison Jurídica' },
        { id: 'monochrome', label: 'Monochrome Estate' },
        { id: 'deco', label: 'Art Déco Jurídico' },
        { id: 'atelier', label: 'Atelier Contemporâneo' },
        { id: 'sculpted', label: 'Sculpted Bordeaux' },
        { id: 'soft', label: 'Soft Prestige' }
    ]);

    function isValidTheme(theme) {
        return themes.some(item => item.id === theme);
    }

    function updateControls(theme) {
        document.querySelectorAll('[data-theme-option]').forEach(button => {
            const active = button.dataset.themeOption === theme;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });

        const select = document.getElementById('themeSelect');
        if (select) select.value = theme;
    }

    function apply(theme, persist = true) {
        const selected = isValidTheme(theme) ? theme : DEFAULT_THEME;
        document.documentElement.dataset.quizTheme = selected;
        updateControls(selected);
        if (persist) localStorage.setItem(STORAGE_KEY, selected);
        return selected;
    }

    function selectedFromUrl() {
        return new URLSearchParams(location.search).get('visual');
    }

    function initialize() {
        const requested = selectedFromUrl();
        const stored = localStorage.getItem(STORAGE_KEY);
        return apply(isValidTheme(requested) ? requested : stored);
    }

    function select(theme) {
        const selected = apply(theme);
        const url = new URL(location.href);
        url.searchParams.set('visual', selected);
        history.replaceState({}, '', url);
        return selected;
    }

    function bind() {
        document.querySelectorAll('[data-theme-option]').forEach(button => {
            button.addEventListener('click', () => select(button.dataset.themeOption));
        });

        const selectControl = document.getElementById('themeSelect');
        if (selectControl) {
            selectControl.addEventListener('change', event => select(event.target.value));
        }
    }

    function start() {
        initialize();
        bind();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    return { themes, initialize, select, apply };
})();
