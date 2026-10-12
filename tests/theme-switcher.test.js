const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const themeSource = fs.readFileSync(path.join(root, 'theme-switcher.js'), 'utf8');
const flowSource = fs.readFileSync(path.join(root, 'quiz-flow.js'), 'utf8');
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

test('protege a contenção horizontal do Sculpted no mobile', () => {
    const mobileBlock = themeStyles.match(/@media\s*\(max-width:\s*860px\)[\s\S]*?(?=@media\s*\(max-width:\s*600px\)|$)/)?.[0] || '';

    assert.match(mobileBlock, /\.stage\s*\{[^}]*inline-size:\s*100%[^}]*max-inline-size:\s*100%/s);
    assert.match(mobileBlock, /\.shell\s*\{[^}]*inline-size:\s*100%[^}]*max-inline-size:\s*100%/s);
    assert.match(mobileBlock, /\.card\s*\{[^}]*min-inline-size:\s*0/s);
    assert.match(mobileBlock, /\.body,[\s\S]*?\.opt-txt\s*\{[^}]*min-inline-size:\s*0[^}]*max-inline-size:\s*100%/s);
    assert.match(mobileBlock, /\.opt-txt\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});

test('não mascara nem trunca a cópia dos cards no mobile', () => {
    const mobileBlock = themeStyles.match(/@media\s*\(max-width:\s*860px\)[\s\S]*?(?=@media\s*\(max-width:\s*600px\)|$)/)?.[0] || '';
    const narrowBlock = themeStyles.match(/@media\s*\(max-width:\s*600px\)[\s\S]*?(?=@media\s*\(prefers-reduced-motion|$)/)?.[0] || '';

    assert.match(mobileBlock, /html\[data-quiz-theme='sculpted'\][\s\S]*?\.opt\s*\{[^}]*overflow-x:\s*visible/s);
    assert.doesNotMatch(mobileBlock, /\.card\s*\{[^}]*overflow-x:\s*(?:clip|hidden)/s);
    assert.match(narrowBlock, /\.entry-options \.opt\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*36px\)\s+minmax\(0,\s*1fr\)/s);
    assert.match(narrowBlock, /\.entry-options \.opt-txt,[\s\S]*?\.entry-options \.opt-txt > span\s*\{[^}]*max-inline-size:\s*100%[^}]*overflow-wrap:\s*anywhere/s);
    assert.doesNotMatch(themeStyles, /\.opt-txt[^}]*text-overflow:\s*ellipsis/i);
});

test('mantém resultado, termômetro e formulário dentro da largura mobile', () => {
    assert.match(styles, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.success-step\s*\{[^}]*min-inline-size:\s*0[^}]*max-inline-size:\s*100%/s);
    assert.match(styles, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.authority-card,[\s\S]*?\.success-step #leadForm\s*\{[^}]*box-sizing:\s*border-box/s);
    assert.match(styles, /@media\s*\(max-width:\s*600px\)[\s\S]*?\.urgency-status,[\s\S]*?\.urgency-deadline\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});

test('entrega score de prioridade, termômetro semafórico e cautela sem laudo', () => {
    const text = visibleText(html);

    assert.match(text, /Análise concluída/i);
    assert.doesNotMatch(text, /\bquiz\b/i);
    assert.doesNotMatch(html, /triagePercentage|laudoBox|laudo-option-box/i);
    assert.match(html, /id="scoreValue"/i);
    assert.match(html, /id="urgencyMarker"/i);
    assert.match(html, /data-level="yellow"/i);
    assert.match(html, /<section[^>]+id="urgencyIndicator"[^>]+aria-labelledby="urgencyLabel"/i);
    assert.match(html, /id="urgencyTrack"[^>]+aria-label="Termômetro de urgência"/i);
    assert.match(html, /id="urgencyFill"/i);
    assert.match(text, /Falta pouco\.\.\./i);
    assert.match(html, /id="urgencyDeadlineNote"[^>]+hidden[^>]*>\s*Seu prazo pode já estar correndo\./i);
    assert.match(text, /não garante resultado ou atendimento em prazo determinado/i);
    assert.match(styles, /\.urgency-track\s*\{[\s\S]*?linear-gradient\([^)]*#6[0-9a-f]{5}[^)]*#d[0-9a-f]{5}[^)]*#9[0-9a-f]{5}/i);
    assert.match(styles, /\.urgency-marker\s*\{/s);
    assert.match(styles, /\.score-value\s*\{/s);
    assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.urgency-fill[\s\S]*?transition:\s*none/s);
});

test('integração não mantém referências de produção ao legado de laudo ou score', () => {
    const forbidden = /oferta_laudo|qualificado_laudo|laudo_fechar|triagePercentage|animatePercentage|laudoBox/i;

    assert.doesNotMatch(html, forbidden);
    assert.doesNotMatch(flowSource, forbidden);
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
