const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'quiz-flow.js'), 'utf8');

function loadFlow({ webhookUrl = null, fetchImpl = null } = {}) {
    const storage = new Map();
    const elements = new Map();
    const networkCalls = [];
    const timeoutCalls = [];
    const intervalCalls = [];
    const runtimeSource = webhookUrl
        ? source.replace(
            "const N8N_WEBHOOK_URL = 'https://n8n.seu-dominio.com/webhook/quiz-events';",
            `const N8N_WEBHOOK_URL = ${JSON.stringify(webhookUrl)};`
        )
        : source;
    const element = () => ({
        style: {},
        dataset: {},
        classList: { add() {}, remove() {} },
        querySelector() { return null; },
        focus() {},
        setAttribute(name, value) { this[name] = String(value); },
        offsetHeight: 600,
        textContent: '',
        innerHTML: '',
        hidden: false,
        disabled: false
    });
    const sandbox = {
        console,
        Blob,
        URL,
        URLSearchParams,
        Date,
        Math,
        setTimeout: (callback, delay) => {
            timeoutCalls.push({ callback, delay });
            return timeoutCalls.length;
        },
        clearTimeout() {},
        setInterval: (callback, delay) => {
            intervalCalls.push({ callback, delay });
            return intervalCalls.length;
        },
        clearInterval() {},
        sessionStorage: {
            getItem: key => storage.get(key) || null,
            setItem: (key, value) => storage.set(key, value)
        },
        document: {
            referrer: 'https://partner.example/campaign?lead=private',
            addEventListener() {},
            getElementById(id) {
                if (!elements.has(id)) elements.set(id, element());
                return elements.get(id);
            },
            querySelector(selector) {
                if (selector === '.contact-intro') return this.getElementById('contactIntro');
                return null;
            },
            querySelectorAll() { return []; }
        },
        navigator: {
            sendBeacon(url, data) {
                networkCalls.push({ kind: 'beacon', url, data });
                return true;
            }
        },
        location: { search: '?utm_source=google&utm_medium=cpc&utm_campaign=outubro' },
        window: {
            matchMedia: () => ({ matches: true }),
            parent: { postMessage() {} },
            location: {},
            ResizeObserver: null
        },
        fetch: (url, options) => {
            networkCalls.push({ kind: 'fetch', url, options });
            return fetchImpl ? fetchImpl(url, options) : Promise.resolve({ ok: true });
        }
    };

    vm.createContext(sandbox);
    vm.runInContext(`${runtimeSource}\n;globalThis.__quiz = {
        FLOW, state, applyRules, finishBranch, renderQuestion, answerQuestion,
        showDismissal, showAnalysis, handleLeadSubmit,
        toggleMultiSelect: typeof toggleMultiSelect === 'function' ? toggleMultiSelect : undefined,
        confirmMultiSelect: typeof confirmMultiSelect === 'function' ? confirmMultiSelect : undefined,
        getDismissalContent, isDismissedOutcome: typeof isDismissedOutcome === 'function' ? isDismissedOutcome : undefined,
        updateUrgencyIndicator: typeof updateUrgencyIndicator === 'function' ? updateUrgencyIndicator : undefined,
        calculatePriorityScore: typeof calculatePriorityScore === 'function' ? calculatePriorityScore : undefined,
        animateScore: typeof animateScore === 'function' ? animateScore : undefined,
        buildLeadWhatsapp, buildLeadPayload: typeof buildLeadPayload === 'function' ? buildLeadPayload : undefined,
        buildAnalyticsPayload: typeof buildAnalyticsPayload === 'function' ? buildAnalyticsPayload : undefined,
        buildWhatsappHandoff: typeof buildWhatsappHandoff === 'function' ? buildWhatsappHandoff : undefined,
        sendEvent: typeof sendEvent === 'function' ? sendEvent : undefined,
        sendAnalyticsEvent
    };`, sandbox);

    return {
        api: sandbox.__quiz,
        elements,
        getElement: id => sandbox.document.getElementById(id),
        networkCalls,
        timeoutCalls,
        intervalCalls,
        window: sandbox.window
    };
}

function resetState(state, overrides = {}) {
    Object.assign(state, {
        branch: null,
        questionIndex: 0,
        answers: [],
        tags: [],
        urgent: false,
        personType: null,
        valueCode: null,
        valueLabel: null,
        outcome: null,
        selectedOptions: [],
        ...overrides
    });
}

test('processo usa comunicação, faixa e bens sob risco sem reduzir a urgência', () => {
    const { api } = loadFlow();
    const { FLOW, state, applyRules, finishBranch } = api;

    assert.deepEqual(JSON.parse(JSON.stringify(FLOW.processo.questions.map(([question, options]) => [question, options.map(([label]) => label)]))), [
        ['Como você recebeu a comunicação do processo?', ['Oficial de justiça', 'Carta dos Correios', 'WhatsApp', 'Outro meio', 'Não sei']],
        ['Qual o valor que o banco está cobrando?', ['Até R$ 50 mil', 'R$ 50 a 100 mil', 'R$ 100 a 300 mil', 'R$ 300 a 500 mil', 'Acima de R$ 500 mil', 'Não sei']],
        ['Quais bens ou valores podem estar em risco?', ['Conta', 'Imóvel', 'Veículo', 'Recebíveis', 'Salário/dinheiro', 'Não sei']]
    ]);

    resetState(state, { branch: 'processo', tags: ['processo'] });
    applyRules('processo', 0, 'whatsapp', 'WhatsApp');
    applyRules('processo', 1, 'ate_50', 'Até R$ 50 mil');
    finishBranch();

    assert.equal(state.urgent, true);
    assert.equal(state.outcome, 'qualificado');
    assert.ok(Array.from(state.tags).includes('urgente'));
});

test('bens em risco são a única pergunta multisseleção e exigem confirmação', () => {
    const { api, elements } = loadFlow();
    const { FLOW, state, renderQuestion, toggleMultiSelect, confirmMultiSelect } = api;

    assert.equal(FLOW.processo.questions[2][2].multiple, true);
    assert.equal(typeof toggleMultiSelect, 'function');
    assert.equal(typeof confirmMultiSelect, 'function');

    resetState(state, { branch: 'processo', questionIndex: 2, tags: ['processo'] });
    renderQuestion();
    assert.match(elements.get('step2Options').innerHTML, /type="checkbox"/);
    assert.match(elements.get('step2Options').innerHTML, /Confirmar bens em risco/);

    toggleMultiSelect('Imóvel', 'imovel', true);
    toggleMultiSelect('Veículo', 'veiculo', true);
    confirmMultiSelect();

    assert.equal(state.questionIndex, 3);
    assert.deepEqual(JSON.parse(JSON.stringify(state.answers[0])), {
        question: 'Quais bens ou valores podem estar em risco?',
        answer: 'Imóvel; Veículo',
        value: ['imovel', 'veiculo']
    });
});

test('bloqueio fiscal ou trabalhista sai da triagem bancária sem revelar contato', () => {
    const { api, elements } = loadFlow();
    const { FLOW, state, applyRules, finishBranch, getDismissalContent, isDismissedOutcome } = api;

    assert.deepEqual(JSON.parse(JSON.stringify(FLOW.bloqueio.questions[1][1].map(([label]) => label))), ['Dívida bancária', 'Cobrança fiscal', 'Processo trabalhista', 'Não sei']);
    assert.equal(typeof isDismissedOutcome, 'function');

    resetState(state, { branch: 'bloqueio', tags: ['bloqueio'] });
    applyRules('bloqueio', 1, 'fiscal', 'Cobrança fiscal');
    finishBranch();

    assert.equal(state.outcome, 'fora_do_bancario');
    assert.equal(isDismissedOutcome(state.outcome), true);
    const guidance = getDismissalContent(state.outcome).guidance;
    assert.match(guidance, /advogado/i);
    assert.match(guidance, /Defensoria|entidade de classe/i);

    api.showDismissal(state.outcome);
    assert.equal(elements.get('leadForm').hidden, true);
});

test('financiamento imobiliário aceita parcela em dia que se tornou insustentável', () => {
    const { api } = loadFlow();
    const firstQuestion = api.FLOW.imovel.questions[0];

    assert.equal(api.FLOW.imovel.label, 'Financiamento imobiliário');
    assert.equal(firstQuestion[0], 'Como estão as parcelas?');
    assert.deepEqual(JSON.parse(JSON.stringify(firstQuestion[1].map(([label]) => label))), ['Em dia, mas insustentáveis', 'Atrasadas', 'Renegociadas', 'Não sei']);
});

test('golpe só dispensa dinâmicas conhecidas fora da falsa central com PIX', () => {
    const { api } = loadFlow();
    const { state, applyRules } = api;

    assert.equal(api.FLOW.golpe.label, 'Golpe PIX de falsa central');

    resetState(state, { branch: 'golpe' });
    applyRules('golpe', 0, 'aplicativo', 'Instalação de aplicativo');
    assert.equal(state.outcome, 'golpe_fora_escopo');

    resetState(state, { branch: 'golpe' });
    applyRules('golpe', 0, 'nao_sei', 'Não sei');
    assert.equal(state.outcome, null);
});

test('exterior usa a nomenclatura aprovada e mantém investimento em análise', () => {
    const { api } = loadFlow();
    const { FLOW, state, finishBranch } = api;

    assert.equal(FLOW.exterior.label, 'Residente no exterior');
    assert.deepEqual(JSON.parse(JSON.stringify(FLOW.exterior.questions[0][1].map(([label]) => label))), [
        'Tenho conta ou dívida no Brasil',
        'Quero investir no Brasil',
        'Imóvel no Brasil',
        'Outro assunto bancário',
        'Não sei'
    ]);

    resetState(state, { branch: 'exterior', tags: ['exterior'] });
    finishBranch();
    assert.equal(state.outcome, 'qualificado');
});

test('faixas de valor registram contexto sem criar dispensa ou caminho de laudo', () => {
    const { api } = loadFlow();
    const { state, finishBranch, isDismissedOutcome } = api;

    resetState(state, { branch: 'empresa', valueCode: 'ate_50', valueLabel: 'Até R$ 50 mil', tags: ['empresa'] });
    finishBranch();

    assert.equal(state.outcome, 'qualificado');
    assert.equal(isDismissedOutcome('oferta_laudo'), false);
});

test('indicador de urgência usa os IDs do resultado e atualiza sem animação reduzida', () => {
    const { api, elements } = loadFlow();

    assert.equal(typeof api.updateUrgencyIndicator, 'function');
    api.updateUrgencyIndicator(true);

    assert.equal(elements.get('urgencyIndicator').dataset.urgent, 'true');
    assert.match(elements.get('urgencyStatus').textContent, /prioridade/i);
    assert.equal(elements.get('urgencyDeadlineNote').hidden, false);
    assert.equal(elements.get('urgencyFill').style.transition, 'none');
});

test('score de prioridade alimenta o termômetro sem usar valor como promessa jurídica', () => {
    const { api, elements } = loadFlow();

    assert.equal(typeof api.calculatePriorityScore, 'function');
    assert.equal(api.calculatePriorityScore(false), 52);
    assert.equal(api.calculatePriorityScore(true), 84);

    api.updateUrgencyIndicator(84);

    assert.equal(elements.get('scoreValue').textContent, '84');
    assert.equal(elements.get('scoreValue').getAttribute('aria-label'), 'Score de prioridade: 84 de 100');
    assert.equal(elements.get('urgencyFill').style.width, '84%');
    assert.equal(elements.get('urgencyMarker').style.left, '84%');
    assert.equal(elements.get('urgencyIndicator').dataset.level, 'red');
});

test('payload de lead versiona consentimento e limita atribuição a UTMs', () => {
    const { api } = loadFlow();
    const { state, buildLeadPayload } = api;

    assert.equal(typeof buildLeadPayload, 'function');
    resetState(state, {
        branch: 'empresa',
        tags: ['empresa'],
        valueLabel: 'Até R$ 50 mil',
        answers: [{ question: 'Qual dívida?', answer: 'Capital de giro', value: 'capital_giro' }]
    });
    const payload = buildLeadPayload({
        name: 'Pessoa de teste',
        whatsapp: '5511999999999',
        city: 'São Paulo',
        state: 'SP',
        contactPeriod: 'manha'
    });

    assert.equal(payload.event_type, 'lead_submission');
    assert.equal(payload.channel, 'web_form');
    assert.equal(payload.channel_user_id, null);
    assert.equal(payload.contact_period, 'manha');
    assert.match(payload.event_id, /^evt_/);
    assert.match(payload.consent_version, /^web_form_/);
    assert.match(payload.consent_timestamp, /^\d{4}-\d{2}-\d{2}T/);
    assert.deepEqual(JSON.parse(JSON.stringify([payload.utm_source, payload.utm_medium, payload.utm_campaign])), ['google', 'cpc', 'outubro']);
    assert.equal(payload.origin, undefined);
});

test('analytics mantém somente os campos permitidos, sem PII ou relato livre', () => {
    const { api } = loadFlow();
    const { state, buildAnalyticsPayload } = api;

    assert.equal(typeof buildAnalyticsPayload, 'function');
    resetState(state, {
        branch: 'outro',
        tags: ['outro'],
        answers: [{ question: 'Conte', answer: 'Relato livre que não pode sair', value: 'texto_livre' }]
    });
    const payload = buildAnalyticsPayload('ramo_outro');
    const serialized = JSON.stringify(payload);

    assert.equal(payload.event_type, 'analytics');
    assert.deepEqual(Object.keys(payload).sort(), [
        'branch', 'branch_label', 'event_id', 'event_type', 'session_id', 'tags', 'timestamp',
        'urgent', 'utm_campaign', 'utm_medium', 'utm_source', 'value_range'
    ]);
    for (const field of ['name', 'whatsapp', 'city', 'state', 'answers', 'nome', 'respostas']) assert.equal(Object.hasOwn(payload, field), false);
    assert.doesNotMatch(serialized, /Relato livre/);
});

test('webhook placeholder não gera chamadas de rede e o handoff minimiza a mensagem', async () => {
    const { api, networkCalls } = loadFlow();
    const { state, sendEvent, sendAnalyticsEvent, buildWhatsappHandoff } = api;

    assert.equal(typeof sendEvent, 'function');
    resetState(state, { branch: 'processo', urgent: true, tags: ['processo'], valueLabel: 'Acima de R$ 500 mil' });
    await sendEvent({ event_type: 'lead_submission' });
    sendAnalyticsEvent('ramo_processo');
    assert.deepEqual(networkCalls, []);

    assert.equal(typeof buildWhatsappHandoff, 'function');
    const handoff = decodeURIComponent(buildWhatsappHandoff({
        name: 'Pessoa de teste',
        city: 'São Paulo',
        state: 'SP'
    }));
    assert.match(handoff, /Ramo: Banco me processou/);
    assert.match(handoff, /Urgência: Sim/);
    assert.match(handoff, /Nome: Pessoa de teste/);
    assert.match(handoff, /Cidade\/UF: São Paulo\/SP/);
    assert.doesNotMatch(handoff, /Acima de R\$ 500 mil|Relato livre|respostas|Documentos/i);
});

test('submissão navega para o WhatsApp sem aguardar webhook que nunca resolve', () => {
    const neverResolves = new Promise(() => {});
    const { api, getElement, networkCalls, window } = loadFlow({
        webhookUrl: 'https://events.example/webhook',
        fetchImpl: () => neverResolves
    });
    const { state, handleLeadSubmit } = api;

    resetState(state, { branch: 'empresa', tags: ['empresa'] });
    getElement('nome').value = 'Pessoa de teste';
    getElement('whatsapp').value = '(11) 99999-9999';
    getElement('ddi').value = '+55';
    getElement('cidade').value = 'São Paulo';
    getElement('estado').value = 'sp';
    getElement('horario').value = 'manha';
    getElement('consentimento').checked = true;

    handleLeadSubmit({ preventDefault() {} });

    assert.equal(networkCalls.length, 1);
    assert.match(window.location.href, /^https:\/\/wa\.me\/5524992331416\?text=/);
});

test('movimento reduzido pula análise temporizada e não inicia status rotativo', () => {
    const { api, timeoutCalls, intervalCalls, elements } = loadFlow();
    const { state, showAnalysis } = api;

    resetState(state, { branch: 'empresa', outcome: 'qualificado', tags: ['empresa'] });
    showAnalysis();

    assert.deepEqual(timeoutCalls, []);
    assert.deepEqual(intervalCalls, []);
    assert.equal(elements.get('successTitle').textContent, 'Análise concluída');
    assert.equal(elements.get('scoreValue').textContent, '52');
});
