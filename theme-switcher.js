const ThemePreview = (() => {
    const themes = Object.freeze([
        { id: 'sculpted', label: 'Sculpted Bordeaux' }
    ]);

    function initialize() {
        document.documentElement.dataset.quizTheme = 'sculpted';
        return 'sculpted';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    return { themes, initialize };
})();
