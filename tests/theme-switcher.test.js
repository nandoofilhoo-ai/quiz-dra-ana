const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'theme-switcher.js');
const source = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : '';

function loadThemePreview(search = '', storedTheme = null) {
    const storage = new Map();
    if (storedTheme) storage.set('quiz_visual_theme', storedTheme);

    const rootElement = { dataset: {} };
    const sandbox = {
        URL,
        URLSearchParams,
        location: { href: `https://example.test/${search}`, search },
        history: { replaceState() {} },
        localStorage: {
            getItem: key => storage.get(key) || null,
            setItem: (key, value) => storage.set(key, value)
        },
        document: {
            documentElement: rootElement,
            readyState: 'loading',
            addEventListener() {},
            getElementById() { return null; },
            querySelectorAll() { return []; }
        }
    };

    vm.createContext(sandbox);
    vm.runInContext(`${source}\n;globalThis.__themePreview = typeof ThemePreview === 'undefined' ? null : ThemePreview;`, sandbox);
    return { api: sandbox.__themePreview, rootElement, storage };
}

test('disponibiliza as seis propostas visuais aprovadas', () => {
    const { api } = loadThemePreview();
    assert.ok(api, 'o controlador visual deve existir');
    assert.deepEqual(
        Array.from(api.themes, theme => theme.id),
        ['maison', 'monochrome', 'deco', 'atelier', 'sculpted', 'soft']
    );
});

test('tema indicado na URL prevalece e fica salvo para a apresentação', () => {
    const { api, rootElement, storage } = loadThemePreview('?visual=atelier', 'monochrome');
    assert.ok(api, 'o controlador visual deve existir');

    const selected = api.initialize();

    assert.equal(selected, 'atelier');
    assert.equal(rootElement.dataset.quizTheme, 'atelier');
    assert.equal(storage.get('quiz_visual_theme'), 'atelier');
});

test('tema inválido na URL recorre à preferência salva', () => {
    const { api, rootElement } = loadThemePreview('?visual=inexistente', 'sculpted');
    assert.ok(api, 'o controlador visual deve existir');

    const selected = api.initialize();

    assert.equal(selected, 'sculpted');
    assert.equal(rootElement.dataset.quizTheme, 'sculpted');
});
