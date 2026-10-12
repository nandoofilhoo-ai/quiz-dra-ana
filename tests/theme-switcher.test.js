const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const themeSource = fs.readFileSync(path.join(root, 'theme-switcher.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const themeStyles = fs.readFileSync(path.join(root, 'themes.css'), 'utf8');

function loadThemePreview(initialTheme = '') {
    const rootElement = { dataset: { quizTheme: initialTheme } };
    const sandbox = {
        document: {
            documentElement: rootElement,
            readyState: 'loading',
            addEventListener() {}
        }
    };

    vm.createContext(sandbox);
    vm.runInContext(`${themeSource}\n;globalThis.__themePreview = typeof ThemePreview === 'undefined' ? null : ThemePreview;`, sandbox);
    return { api: sandbox.__themePreview, rootElement };
}

function visibleText(markup) {
    return markup
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

test('fixa Sculpted de forma idempotente sem seletor ou query de apresentação', () => {
    const { api, rootElement } = loadThemePreview('maison');

    assert.ok(api, 'o inicializador do tema deve existir');
    assert.deepEqual(Array.from(api.themes, theme => theme.id), ['sculpted']);
    assert.equal(api.initialize(), 'sculpted');
    assert.equal(api.initialize(), 'sculpted');
    assert.equal(rootElement.dataset.quizTheme, 'sculpted');
    assert.match(html, /<html[^>]+data-quiz-theme="sculpted"/i);
    assert.doesNotMatch(html, /visual-picker|themeSelect|data-theme-option/i);
    assert.doesNotMatch(themeSource, /URLSearchParams|localStorage|[?&]visual=/i);
    assert.doesNotMatch(themeStyles, /data-quiz-theme=['"](?:maison|monochrome|deco|atelier|soft|editorial|private|gallery|glass)['"]/i);
});

test('mantém as dez entradas verticais com o mapa público PF e PJ aprovado', () => {
    const expected = {
        processo: 'PF/PJ',
        empresa: 'PJ',
        bloqueio: 'PF/PJ',
        recebiveis: 'PJ',
        avalista: 'PF/PJ',
        imovel: 'PF/PJ',
        servidor: 'PF',
        golpe: 'PF',
        exterior: 'PF',
        outro: 'PF/PJ'
    };

    for (const [branch, audience] of Object.entries(expected)) {
        const option = new RegExp(`<button[^>]+data-branch="${branch}"[\\s\\S]*?data-audience="${audience.replace('/', '\\/')}"[\\s\\S]*?<\\/button>`, 'i');
        assert.match(html, option, `${branch} deve exibir o marcador ${audience}`);
    }

    assert.match(styles, /\.entry-options\s*\{[^}]*grid-template-columns:\s*1fr\s*;/s);
    assert.match(styles, /\.audience-chip\s*\{[^}]*white-space:\s*nowrap\s*;/s);
    assert.match(styles, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.entry-options \.opt\s*\{[^}]*grid-template-columns:\s*40px\s+minmax\(0,\s*1fr\)\s*;/s);
    assert.match(styles, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.entry-options \.opt-arrow\s*\{[^}]*display:\s*none\s*;/s);
});

test('entrega resultado qualitativo sem score, laudo ou promessa de prazo', () => {
    const text = visibleText(html);

    assert.match(text, /Resultado apurado/i);
    assert.doesNotMatch(text, /\bquiz\b/i);
    assert.doesNotMatch(html, /triagePercentage|laudoBox|laudo-option-box/i);
    assert.doesNotMatch(text, /\d+(?:[,.]\d+)?\s*%/);
    assert.match(html, /<section[^>]+id="urgencyIndicator"[^>]+aria-labelledby="urgencyLabel"/i);
    assert.match(html, /id="urgencyTrack"[^>]+aria-hidden="true"/i);
    assert.match(html, /id="urgencyFill"/i);
    assert.match(html, /id="urgencyDeadlineNote"[^>]+hidden[^>]*>\s*Seu prazo pode já estar correndo\./i);
    assert.match(text, /não garante resultado ou atendimento em prazo determinado/i);
    assert.match(styles, /\.urgency-fill\s*\{[^}]*background:\s*var\(--burgundy\)/s);
    assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.urgency-fill[\s\S]*?transition:\s*none/s);
});

test('mantém consentimento antes dos dados e limita contato a manhã ou tarde', () => {
    const consent = html.indexOf('id="consentimento"');
    const name = html.indexOf('id="nome"');
    const period = html.match(/<select id="horario"[\s\S]*?<\/select>/i)?.[0] || '';

    assert.ok(consent >= 0 && consent < name, 'o consentimento deve anteceder os campos de contato');
    assert.match(period, /<option[^>]*>Manhã<\/option>/i);
    assert.match(period, /<option[^>]*>Tarde<\/option>/i);
    assert.doesNotMatch(period, /Noite/i);
});

test('mantém a cópia pública simples, sem dados institucionais pendentes ou travessões', () => {
    const text = visibleText(html);

    assert.doesNotMatch(text, /CNPJ|OAB\//i);
    assert.doesNotMatch(text, /[—–]/);
    assert.match(text, /Financiamento imobiliário/);
    assert.match(text, /Golpe PIX de falsa central/);
    assert.match(text, /Residente no exterior/);
});
