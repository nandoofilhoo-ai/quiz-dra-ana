/**
 * Fluxo de triagem da Dra. Ana Magalhães.
 * As decisões operacionais seguem docs/manychat-flow-spec.md.
 */

const N8N_WEBHOOK_URL = 'https://dinastia-n8n-webhook.q4obno.easypanel.host/webhook/quiz-events';
const WHATSAPP_NUMBER = '5524992331416';
const CONSENT_VERSION = 'web_form_v1';
const MIN_PRIORITY_SCORE = 75.3;
const MAX_PRIORITY_SCORE = 98.6;
let scoreAnimationFrame = null;
let scoreAnimationCancel = null;

const ICONS = {
    process: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></svg>',
    bank: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M2 20h20M12 3l9 5H3z"/></svg>',
    money: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M7 9H6v1M17 15h1v-1"/></svg>',
    company: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V6l8-3 8 3v14M2 20h20M8 10h1M15 10h1M8 14h1M15 14h1"/></svg>',
    person: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
    home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 11 9-7 9 7M5 10v10h14V10M9 20v-5h6v5"/></svg>',
    phone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.6a2 2 0 0 1-.6 1.8L7.6 9.4a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.8-.6l2.6.4a2 2 0 0 1 1.7 2z"/></svg>',
    globe: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
    service: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>',
    other: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.3 2.3 0 1 1 3.7 1.8c-.9.7-1.5 1.2-1.5 2.2M12 17h.01"/></svg>'
};

const VALUE_OPTIONS = [
    ['Até R$ 50 mil', 'ate_50'],
    ['R$ 50 a 100 mil', '50_100'],
    ['R$ 100 a 300 mil', '100_300'],
    ['R$ 300 a 500 mil', '300_500'],
    ['Acima de R$ 500 mil', 'acima_500'],
    ['Não sei', 'nao_sei']
];

const FLOW = {
    processo: {
        label: 'Banco me processou', type: 'empresa_ou_pessoa', icon: 'process', valueQuestion: 1,
        questions: [
            ['Como você recebeu a comunicação do processo?', [['Oficial de justiça', 'oficial'], ['Carta dos Correios', 'carta'], ['WhatsApp', 'whatsapp'], ['Outro meio', 'outro_meio'], ['Não sei', 'nao_sei']]],
            ['Qual o valor que o banco está cobrando?', VALUE_OPTIONS],
            ['Quais bens ou valores podem estar em risco?', [['Conta', 'conta'], ['Imóvel', 'imovel'], ['Veículo', 'veiculo'], ['Recebíveis', 'recebiveis'], ['Salário/dinheiro', 'salario_dinheiro'], ['Não sei', 'nao_sei']], { multiple: true, confirmLabel: 'Confirmar bens em risco' }]
        ],
        result: 'Suas respostas sobre o processo, a cobrança e os bens em risco serão repassadas ao especialista responsável.',
        docs: 'Comunicação recebida, contrato da dívida e documentos dos bens ou valores envolvidos'
    },
    empresa: {
        label: 'Empresa endividada', type: 'empresa', icon: 'company', valueQuestion: 2,
        questions: [
            ['Qual a dívida principal?', [['Pronampe/FGI', 'pronampe'], ['Capital de giro', 'capital_giro'], ['Cheque especial', 'cheque'], ['Cartão', 'cartao'], ['Mais de uma', 'varias'], ['Não sei', 'nao_sei']]],
            ['Qual a situação?', [['Em dia, mas sufocando caixa', 'em_dia'], ['Atrasadas', 'atrasadas'], ['Renegociadas', 'renegociada'], ['Negativação/protesto', 'protesto'], ['Juros altos', 'juros'], ['Não sei', 'nao_sei']]],
            ['Qual a faixa do total devido?', VALUE_OPTIONS],
            ['Há garantia?', [['Aval dos sócios', 'avalista'], ['Imóvel/veículo', 'bem'], ['Recebíveis', 'recebiveis'], ['Fundo garantidor', 'fundo'], ['Não sei', 'nao_sei']]],
            ['A empresa funciona?', [['Faturando normalmente', 'normal'], ['Faturando pouco', 'pouco'], ['Parada', 'parada'], ['Não sei', 'nao_sei']]]
        ],
        result: 'Suas respostas sobre as dívidas, garantias e o caixa da empresa serão repassadas ao especialista responsável.',
        docs: 'Contratos das dívidas e extratos dos últimos 3 meses'
    },
    bloqueio: {
        label: 'Conta bloqueada', type: 'empresa_ou_pessoa', icon: 'bank',
        questions: [
            ['Quem originou o bloqueio?', [['Banco', 'banco'], ['Justiça', 'justica'], ['Não sei', 'nao_sei']]],
            ['A origem é bancária, fiscal ou trabalhista?', [['Dívida bancária', 'bancaria'], ['Cobrança fiscal', 'fiscal'], ['Processo trabalhista', 'trabalhista'], ['Não sei', 'nao_sei']]],
            ['O que foi bloqueado e qual o impacto?', [['Conta', 'conta'], ['Recebíveis', 'recebiveis'], ['Salário', 'salario'], ['Reserva', 'reserva'], ['Outro', 'outro'], ['Não sei', 'nao_sei']]]
        ],
        result: 'Suas respostas sobre a origem, o impacto e os documentos do bloqueio serão repassadas ao especialista responsável.',
        docs: 'Extrato mostrando o bloqueio e número do processo, se houver'
    },
    recebiveis: {
        label: 'Recebíveis retidos', type: 'empresa', icon: 'money',
        questions: [
            ['O que está retido?', [['Maquininha', 'maquininha'], ['Duplicatas/boletos', 'duplicatas'], ['Aplicação/saldo', 'saldo'], ['Não sei', 'nao_sei']]],
            ['A retenção está ligada a qual dívida?', [['Capital de giro', 'capital_giro'], ['Antecipação', 'antecipacao'], ['Cheque especial/conta garantida', 'cheque'], ['Não sei', 'nao_sei']]],
            ['Qual a proporção aproximada?', [['Menos de 30%', 'menos_30'], ['30% a 60%', '30_60'], ['Mais de 60%', 'mais_60'], ['Praticamente tudo', 'tudo'], ['Não sei', 'nao_sei']]],
            ['As parcelas estão?', [['Em dia', 'em_dia'], ['Atrasadas', 'atrasadas'], ['Renegociadas e sem pagamento', 'renegociada'], ['Não sei', 'nao_sei']]]
        ],
        result: 'Suas respostas sobre a retenção, a dívida e o impacto no caixa serão repassadas ao especialista responsável.',
        docs: 'Contrato da dívida e extrato da maquininha ou da conta vinculada'
    },
    avalista: {
        label: 'Sócio ou avalista', type: 'empresa_ou_pessoa', icon: 'person', valueQuestion: 2,
        questions: [
            ['Qual a situação?', [['Avalista da empresa', 'avalista_empresa'], ['Sócio de empresa devedora', 'socio'], ['Saiu da sociedade', 'ex_socio'], ['Avalista de outra pessoa', 'avalista_pessoa'], ['Não sei', 'nao_sei']]],
            ['O que aconteceu?', [['Cobranças', 'cobranca'], ['Negativação', 'negativado'], ['Processo', 'processo'], ['Bloqueio de conta/bem', 'bloqueio'], ['Não sei', 'nao_sei']]],
            ['Qual a faixa do valor?', VALUE_OPTIONS],
            ['O que teme perder?', [['Moradia', 'moradia'], ['Outros imóveis', 'imoveis'], ['Veículos', 'veiculos'], ['Salário/dinheiro', 'dinheiro'], ['Não sei', 'nao_sei']]],
            ['A empresa está?', [['Ativa', 'ativa'], ['Parada', 'parada'], ['Encerrada', 'encerrada'], ['Não sei', 'nao_sei']]]
        ],
        result: 'Suas respostas sobre as garantias, cobranças e o patrimônio em risco serão repassadas ao especialista responsável.',
        docs: 'Contrato com a sua assinatura e contrato social da empresa'
    },
    imovel: {
        label: 'Financiamento imobiliário', type: 'empresa_ou_pessoa', icon: 'home', valueQuestion: 4,
        questions: [
            ['Como estão as parcelas?', [['Em dia, mas insustentáveis', 'em_dia_insustentavel'], ['Atrasadas', 'atrasadas'], ['Renegociadas', 'renegociadas'], ['Não sei', 'nao_sei']]],
            ['Que aviso foi recebido?', [['Nenhum', 'nenhum'], ['Cobrança', 'cobranca'], ['Cartório', 'cartorio'], ['Leilão', 'leilao'], ['Já foi a leilão', 'ja_leilao'], ['Não sei', 'nao_sei']]],
            ['Quem financiou?', [['Caixa', 'caixa'], ['Outro banco', 'banco'], ['Construtora/incorporadora', 'construtora'], ['Não sei', 'nao_sei']]],
            ['Qual o uso do imóvel?', [['Moradia', 'moradia'], ['Investimento', 'investimento'], ['Comercial', 'comercial'], ['Não sei', 'nao_sei']]],
            ['Qual a faixa do saldo?', VALUE_OPTIONS]
        ],
        result: 'Suas respostas sobre as parcelas, os avisos e o financiamento serão repassadas ao especialista responsável.',
        docs: 'Contrato do financiamento e qualquer notificação recebida'
    },
    servidor: {
        label: 'Servidor de carreira', type: 'pessoa', icon: 'service',
        questions: [
            ['Qual o vínculo?', [['Federal', 'federal'], ['Estadual', 'estadual'], ['Municipal', 'municipal'], ['Militar', 'militar'], ['Aposentado/pensionista', 'aposentado'], ['Não sei', 'nao_sei']]],
            ['Qual a faixa da renda bruta?', [['Até R$ 10 mil', 'ate_10'], ['R$ 10 a 20 mil', '10_20'], ['R$ 20 a 30 mil', '20_30'], ['Acima de R$ 30 mil', 'acima_30'], ['Não sei', 'nao_sei']]],
            ['Qual a dívida principal?', [['Consignado', 'consignado'], ['Débito em conta', 'conta'], ['Cartão consignado', 'cartao_consignado'], ['Cartão/cheque especial', 'cartao_cheque'], ['Várias', 'varias'], ['Não sei', 'nao_sei']]],
            ['Há quanto tempo existem empréstimos ou refinanciamentos?', [['Menos de 5 anos', 'menos_5'], ['5 a 10 anos', '5_10'], ['Mais de 10 anos', 'mais_10'], ['Não sei', 'nao_sei']]]
        ],
        result: 'Suas respostas sobre o vínculo, a renda e as dívidas serão repassadas ao especialista responsável.',
        docs: 'Contracheque mais recente e lista das dívidas'
    },
    golpe: {
        label: 'Golpe PIX de falsa central', type: 'pessoa', icon: 'phone', valueQuestion: 1,
        questions: [
            ['Como aconteceu?', [['Ligaram fingindo ser do banco e induziram um PIX', 'pix_falsa_central'], ['Instalação de aplicativo', 'aplicativo'], ['Empréstimo na ligação', 'emprestimo'], ['Não sei', 'nao_sei']]],
            ['Qual a faixa do prejuízo?', VALUE_OPTIONS],
            ['Quando aconteceu?', [['Últimos dias', 'ultimos_dias'], ['Último mês', 'ultimo_mes'], ['1 a 3 meses', '1_3_meses'], ['Mais de 3 meses', 'mais_3_meses'], ['Não sei', 'nao_sei']]],
            ['O que foi feito?', [['Boletim e reclamação', 'ambos'], ['Uma das duas', 'uma'], ['Nada', 'nada'], ['Não sei', 'nao_sei']]],
            ['Qual foi a resposta do banco?', [['Negou', 'negou'], ['Não respondeu', 'sem_resposta'], ['Devolveu parte', 'parcial'], ['Devolveu tudo', 'total'], ['Não sei', 'nao_sei']]]
        ],
        result: 'Suas respostas sobre o golpe, o PIX e o retorno do banco serão repassadas ao especialista responsável.',
        docs: 'Boletim de ocorrência, comprovante do PIX e resposta do banco'
    },
    exterior: {
        label: 'Residente no exterior', type: 'pessoa', icon: 'globe',
        questions: [
            ['Qual é a situação?', [['Tenho conta ou dívida no Brasil', 'conta_divida'], ['Quero investir no Brasil', 'investir'], ['Imóvel no Brasil', 'imovel'], ['Outro assunto bancário', 'outro'], ['Não sei', 'nao_sei']]],
            ['Existe bloqueio, cobrança ou prazo?', [['Sim', 'sim'], ['Não', 'nao'], ['Não sei', 'nao_sei']]]
        ],
        result: 'Suas respostas sobre a situação bancária ligada ao Brasil serão repassadas ao especialista responsável.',
        docs: 'Documentos da conta, dívida ou patrimônio ligado ao Brasil'
    },
    outro: {
        label: 'Meu caso é outro', type: 'indefinido', icon: 'other',
        questions: [
            ['O problema envolve?', [['Dívida da empresa', 'empresa'], ['Dívida pessoal', 'pessoal'], ['Outro assunto bancário', 'outro']]],
            ['Existe processo, bloqueio ou prazo?', [['Sim', 'sim'], ['Não', 'nao'], ['Não sei', 'nao_sei']]],
            ['Conte em uma ou duas frases o que está acontecendo.', []]
        ],
        result: 'Seu relato e suas respostas serão repassados ao especialista responsável.',
        docs: 'Contratos, extratos, notificações e comprovantes relacionados ao caso'
    }
};

const AUTHORITY_POINTS = {
    processo: ['Prazo judicial, fase do processo e bens em risco serão destacados', 'A comunicação recebida ajuda a contextualizar o caso', 'Contrato e documentos dos bens ou valores seguem como prioridades'],
    bloqueio: ['A origem do bloqueio será destacada', 'O impacto sobre conta, recebíveis ou salário será informado', 'Extrato e número do processo seguem com o relato'],
    recebiveis: ['Termos da retenção e contrato serão destacados', 'A proporção retida mostra o impacto sobre o caixa', 'Extratos e instrumentos da dívida seguem com as informações'],
    empresa: ['Contratos bancários e garantias serão informados', 'O impacto da dívida sobre o caixa será destacado', 'A situação operacional da empresa compõe o encaminhamento'],
    avalista: ['Documentos assinados e garantias assumidas serão informados', 'Processo ou bloqueio podem exigir atenção prioritária', 'Contrato social e patrimônio em risco compõem o encaminhamento'],
    imovel: ['A etapa da cobrança será destacada', 'Cartório ou leilão podem exigir atenção prioritária', 'Contrato e avisos recebidos seguem com as informações'],
    servidor: ['Contracheque e histórico das dívidas serão informados', 'Cada operação relatada compõe o encaminhamento', 'A documentação contratual ajuda a contextualizar o caso'],
    golpe: ['Data, dinâmica do golpe e resposta do banco serão informadas', 'Boletim, comprovantes e contestação seguem com o relato', 'A resposta do banco será destacada para o especialista'],
    exterior: ['O vínculo bancário com o Brasil será identificado', 'Bloqueios, cobranças e prazos serão destacados', 'Documentos da conta, dívida ou imóvel seguem com as informações'],
    outro: ['O relato e as respostas seguem para o especialista', 'Processo, bloqueio ou prazo podem definir a prioridade', 'Documentos disponíveis ajudam a contextualizar a situação']
};

const DISMISSAL_OUTCOMES = new Set(['fora_do_bancario', 'golpe_fora_escopo', 'prejuizo_devolvido']);

const state = {
    sessionId: getSessionId(), branch: null, questionIndex: 0, answers: [], tags: [], urgent: false,
    personType: null, valueCode: null, valueLabel: null, outcome: null, selectedOptions: [], transitionTimer: null,
    analysisTimer: null, analysisStatusTimer: null
};

document.addEventListener('DOMContentLoaded', () => {
    const title = document.querySelector('#step1 .q-title');
    const help = document.querySelector('#step1 .q-help');
    if (title) title.textContent = 'O que está acontecendo com você?';
    if (help) help.textContent = 'Se for mais de uma coisa, escolha a mais urgente.';
    sendAnalyticsEvent('inicio');
    sendAutoHeight();
    const container = document.getElementById('quizContainer');
    if (container && window.ResizeObserver) new ResizeObserver(sendAutoHeight).observe(container);
});

function getSessionId() {
    const stored = sessionStorage.getItem('quiz_session_id');
    if (stored) return stored;
    const id = 'sess_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
    sessionStorage.setItem('quiz_session_id', id);
    return id;
}

function handleOptionSelect(step, label, code) {
    if (step === 1) startBranch(code, label);
}

function startBranch(code) {
    const normalized = ({ conta_bloqueada: 'bloqueio', empresa_endividada: 'empresa', golpe_central: 'golpe' })[code] || code;
    if (!FLOW[normalized]) return;
    state.branch = normalized;
    state.questionIndex = 0;
    state.answers = [];
    state.tags = [normalized];
    state.urgent = normalized === 'processo';
    state.personType = FLOW[normalized].type;
    state.valueCode = null;
    state.valueLabel = null;
    state.outcome = null;
    state.selectedOptions = [];
    renderQuestion();
    updateProgress();
    transitionToStep(document.getElementById('step2'));
    sendAnalyticsEvent('ramo_' + normalized);
}

function renderQuestion() {
    const branch = FLOW[state.branch];
    const question = branch.questions[state.questionIndex];
    const title = document.getElementById('step2Title');
    const help = document.getElementById('step2Help');
    const options = document.getElementById('step2Options');
    title.textContent = question[0];
    help.textContent = 'Escolha uma opção para continuar.';
    if (state.branch === 'outro' && state.questionIndex === 2) {
        options.innerHTML = '<div class="free-response"><textarea id="freeCase" maxlength="600" placeholder="Conte em uma ou duas frases."></textarea><button class="free-submit" type="button" onclick="submitFreeText()">Continuar</button></div>';
    } else if (question[2] && question[2].multiple) {
        help.textContent = 'Selecione todos os itens que se aplicam e confirme para continuar.';
        options.innerHTML = question[1].map(([label, value]) => multiOptionCard(label, value, branch.icon)).join('') + `<button class="cta-btn" type="button" onclick="confirmMultiSelect()"><span>${question[2].confirmLabel}</span><span aria-hidden="true">→</span></button>`;
    } else {
        options.innerHTML = question[1].map(([label, value]) => optionCard(label, value, branch.icon)).join('');
    }
    options.classList.remove('is-refreshing');
    void options.offsetWidth;
    options.classList.add('is-refreshing');
    sendAutoHeight();
}

function optionCard(label, value, icon) {
    return `<button class="opt" type="button" onclick="answerQuestion('${escapeJs(label)}','${escapeJs(value)}')"><div class="opt-ico">${ICONS[icon] || ICONS.other}</div><div class="opt-txt"><strong>${label}</strong></div><span class="opt-arrow">→</span></button>`;
}

function multiOptionCard(label, value, icon) {
    return `<label class="opt multi-option"><input type="checkbox" onchange="toggleMultiSelect('${escapeJs(label)}','${escapeJs(value)}', this.checked)"><div class="opt-ico">${ICONS[icon] || ICONS.other}</div><div class="opt-txt"><strong>${label}</strong></div></label>`;
}

function escapeJs(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function toggleMultiSelect(label, value, checked) {
    const selected = state.selectedOptions || [];
    const position = selected.findIndex(option => option.value === value);
    if (checked && position === -1) selected.push({ label, value });
    if (!checked && position !== -1) selected.splice(position, 1);
    state.selectedOptions = selected;
}

function confirmMultiSelect() {
    if (!state.selectedOptions || state.selectedOptions.length === 0) return;
    const selected = state.selectedOptions.slice();
    answerQuestion(selected.map(option => option.label).join('; '), selected.map(option => option.value));
    state.selectedOptions = [];
}

function answerQuestion(label, value) {
    const branch = FLOW[state.branch];
    state.answers.push({ question: branch.questions[state.questionIndex][0], answer: label, value });
    applyRules(state.branch, state.questionIndex, value, label);
    state.questionIndex += 1;
    if (isDismissedOutcome(state.outcome) || state.questionIndex >= branch.questions.length) {
        finishBranch();
        return;
    }
    renderQuestion();
    updateProgress();
}

function submitFreeText() {
    const field = document.getElementById('freeCase');
    const value = field ? field.value.trim() : '';
    if (!value) { if (field) field.focus(); return; }
    answerQuestion(value, 'texto_livre');
}

function addTag(tag) {
    if (tag && !state.tags.includes(tag)) state.tags.push(tag);
}

function applyRules(branch, index, value, label) {
    if (FLOW[branch].valueQuestion === index) {
        state.valueCode = value;
        state.valueLabel = label;
    }
    if (branch === 'processo') state.urgent = true;
    if (branch === 'bloqueio' && index === 1 && ['fiscal', 'trabalhista'].includes(value)) {
        state.outcome = 'fora_do_bancario';
        addTag('fora_do_bancario');
    }
    if (branch === 'recebiveis' && index === 2 && ['mais_60', 'tudo'].includes(value)) state.urgent = true;
    if (branch === 'empresa' && index === 3 && ['recebiveis', 'avalista'].includes(value)) addTag(value);
    if (branch === 'avalista' && index === 1 && ['processo', 'bloqueio'].includes(value)) state.urgent = true;
    if (branch === 'imovel' && index === 1 && ['cartorio', 'leilao', 'ja_leilao'].includes(value)) state.urgent = true;
    if (branch === 'golpe') {
        if (index === 0 && ['aplicativo', 'emprestimo'].includes(value)) state.outcome = 'golpe_fora_escopo';
        if (index === 2 && value === 'ultimos_dias') state.urgent = true;
        if (index === 4 && value === 'total') state.outcome = 'prejuizo_devolvido';
    }
    if (branch === 'outro') {
        if (index === 0) state.personType = value === 'empresa' ? 'empresa' : value === 'pessoal' ? 'pessoa_fisica' : 'indefinido';
        if (index === 1 && value === 'sim') state.urgent = true;
    }
}

function finishBranch() {
    if (state.branch === 'processo') state.urgent = true;
    if (!state.outcome) state.outcome = 'qualificado';
    if (state.urgent) addTag('urgente');
    showAnalysis();
}

function isDismissedOutcome(outcome) {
    return DISMISSAL_OUTCOMES.has(outcome);
}

function showAnalysis() {
    const progress = document.getElementById('progressBar');
    if (progress) progress.style.width = '100%';
    if (prefersReducedMotion()) {
        routeOutcome();
        return;
    }
    transitionToStep(document.getElementById('analysisStep'));
    const status = document.getElementById('analysisStatus');
    const messages = ['Lendo suas respostas', 'Organizando as informações', 'Preparando a orientação'];
    let index = 0;
    clearInterval(state.analysisStatusTimer);
    state.analysisStatusTimer = setInterval(() => {
        index = (index + 1) % messages.length;
        if (status) status.textContent = messages[index];
    }, 620);
    clearTimeout(state.analysisTimer);
    state.analysisTimer = setTimeout(() => {
        clearInterval(state.analysisStatusTimer);
        routeOutcome();
    }, 1800);
}

function routeOutcome() {
    if (isDismissedOutcome(state.outcome)) return showDismissal(state.outcome);
    showQualifiedResult();
}

function getDismissalContent(reason) {
    const messages = {
        fora_do_bancario: {
            title: 'Esta situação precisa de orientação na área correspondente',
            lead: 'Pelo que você informou, o bloqueio não seguirá pela triagem bancária.',
            guidance: 'Procure um advogado da área fiscal ou trabalhista, a Defensoria ou uma entidade de classe para orientação sobre os próximos passos.'
        },
        golpe_fora_escopo: {
            title: 'Esta dinâmica não faz parte da atuação atual do escritório',
            lead: 'Preferimos ser claros para que você possa procurar o caminho mais adequado.',
            guidance: 'Registre o boletim de ocorrência, conteste a operação no seu banco e, se não resolver, procure o consumidor.gov.br, o Banco Central ou o Procon.'
        },
        prejuizo_devolvido: {
            title: 'A situação informada não exige nova medida neste momento',
            lead: 'Como o banco devolveu integralmente o valor, não há prejuízo pendente a recuperar.',
            guidance: 'Se perceber que ficou faltando alguma parte ou surgirem novos fatos, refaça a análise com as informações atualizadas.'
        }
    };
    return messages[reason] || messages.golpe_fora_escopo;
}

function setContactVisibility(visible) {
    const form = document.getElementById('leadForm');
    const intro = document.querySelector('.contact-intro');
    if (form) form.hidden = !visible;
    if (intro) intro.hidden = !visible;
}

function showDismissal(reason) {
    const message = getDismissalContent(reason);
    const badge = document.getElementById('disqBadge');
    if (badge) badge.textContent = 'Resposta franca';
    document.getElementById('disqTitle').textContent = message.title;
    document.getElementById('disqLead').textContent = message.lead;
    document.getElementById('disqContent').innerHTML = `<strong>Nossa orientação para este caso</strong><p>${message.guidance}</p>`;
    setContactVisibility(false);
    document.getElementById('progressWrap').style.display = 'none';
    transitionToStep(document.getElementById('disqualifiedStep'));
}

function getAuthorityContent(branch, urgent) {
    return {
        tone: urgent ? 'urgent' : 'summary',
        title: urgent ? 'Seu caso pede atenção prioritária' : 'Informações que serão repassadas ao especialista',
        points: AUTHORITY_POINTS[branch] || AUTHORITY_POINTS.outro
    };
}

function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function calculatePriorityScore(urgent) {
    return urgent ? MAX_PRIORITY_SCORE : MIN_PRIORITY_SCORE;
}

function clampPriorityScore(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return MIN_PRIORITY_SCORE;
    return Math.max(MIN_PRIORITY_SCORE, Math.min(MAX_PRIORITY_SCORE, numeric));
}

function getUrgencyPosition(score) {
    const numeric = Number(score);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, numeric));
}

function formatScore(value) {
    const score = Math.max(0, Math.min(100, Number(value) || 0));
    return `${score.toFixed(1).replace('.', ',')}%`;
}

function getUrgencyLevel(score) {
    if (score >= 67) return 'red';
    if (score >= 34) return 'yellow';
    return 'green';
}

function animateScore(targetScore) {
    const scoreElement = document.getElementById('scoreValue');
    const fill = document.getElementById('urgencyFill');
    const marker = document.getElementById('urgencyMarker');
    const track = document.getElementById('urgencyTrack');
    const score = clampPriorityScore(targetScore);
    const targetPosition = getUrgencyPosition(score);
    if (!scoreElement) return;
    if (scoreAnimationCancel) scoreAnimationCancel();
    scoreAnimationFrame = null;
    scoreAnimationCancel = null;

    const setVisual = (value, position = getUrgencyPosition(value)) => {
        const current = Number(Math.max(0, Math.min(100, value)).toFixed(1));
        const currentPosition = Number(Math.max(0, Math.min(100, position)).toFixed(1));
        const formatted = formatScore(current);
        scoreElement.textContent = formatted;
        scoreElement.dataset.value = String(current);
        scoreElement.setAttribute('aria-label', `Score de prioridade: ${formatted}`);
        if (typeof scoreElement.getAttribute !== 'function' && typeof scoreElement.setAttribute === 'function') {
            scoreElement.getAttribute = name => scoreElement[name] ?? null;
        }
        if (fill) fill.style.width = `${currentPosition}%`;
        if (marker) marker.style.left = `${currentPosition}%`;
        if (track) track.setAttribute('aria-valuenow', String(currentPosition));
    };

    if (fill) fill.style.transition = 'none';
    if (marker) marker.style.transition = 'none';
    setVisual(0);

    // O contador e o termômetro comunicam uma mudança de estado; continuam
    // animados mesmo com movimento reduzido, enquanto as transições da tela
    // de análise permanecem estáticas para evitar ruído visual.
    const scheduleFrame = callback => {
        if (typeof requestAnimationFrame === 'function') {
            const frameId = requestAnimationFrame(callback);
            scoreAnimationCancel = () => {
                if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frameId);
            };
            return frameId;
        }
        const timeoutId = setTimeout(callback, 16);
        scoreAnimationCancel = () => clearTimeout(timeoutId);
        return timeoutId;
    };

    scoreElement.classList.add('is-counting');
    const startedAt = Date.now();
    const duration = 720;
    const frame = () => {
        const progress = Math.min(1, (Date.now() - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVisual(score * eased, targetPosition * eased);
        if (progress < 1) {
            scoreAnimationFrame = scheduleFrame(frame);
        } else {
            scoreAnimationFrame = null;
            scoreAnimationCancel = null;
            scoreElement.classList.remove('is-counting');
        }
    };
    scoreAnimationFrame = scheduleFrame(frame);
}

function updateUrgencyIndicator(urgentOrScore) {
    const urgent = typeof urgentOrScore === 'boolean' ? urgentOrScore : false;
    const score = typeof urgentOrScore === 'number'
        ? clampPriorityScore(urgentOrScore)
        : calculatePriorityScore(urgent);
    const position = getUrgencyPosition(score);
    const level = getUrgencyLevel(position);
    const indicator = document.getElementById('urgencyIndicator');
    const label = document.getElementById('urgencyLabel');
    const track = document.getElementById('urgencyTrack');
    const status = document.getElementById('urgencyStatus');
    const deadline = document.getElementById('urgencyDeadlineNote');
    if (indicator) {
        indicator.dataset.urgent = String(urgent);
        indicator.dataset.level = level;
    }
    if (label) label.textContent = urgent ? 'Atenção prioritária' : 'Encaminhamento ao especialista';
    if (track) {
        track.setAttribute('aria-valuenow', String(position));
        track.setAttribute('aria-label', 'Termômetro de urgência');
    }
    animateScore(score);
    if (status) status.textContent = urgent ? 'Seu caso foi sinalizado para prioridade de contato com o especialista.' : 'Seu caso será encaminhado ao especialista responsável.';
    if (deadline) deadline.hidden = !urgent;
}

function showQualifiedResult() {
    const branch = FLOW[state.branch];
    const title = document.getElementById('successTitle');
    const lead = document.getElementById('successLead');
    const hint = document.getElementById('documentsHint');
    title.textContent = 'Análise concluída';
    lead.textContent = branch.result;
    hint.textContent = `Para facilitar o contato com o especialista, deixe separados, se puder: ${branch.docs}.`;
    const authority = getAuthorityContent(state.branch, state.urgent);
    const authorityCard = document.getElementById('authorityCard');
    const authorityTitle = document.getElementById('authorityTitle');
    const authorityPoints = document.getElementById('authorityPoints');
    if (authorityCard) authorityCard.dataset.tone = authority.tone;
    if (authorityTitle) authorityTitle.textContent = authority.title;
    if (authorityPoints) authorityPoints.innerHTML = authority.points.map(point => `<li>${point}</li>`).join('');
    setContactVisibility(true);
    const ddiControl = document.getElementById('ddiControl');
    const ddiInput = document.getElementById('ddi');
    if (ddiControl) ddiControl.hidden = state.branch !== 'exterior';
    if (ddiInput) ddiInput.value = '+55';
    document.getElementById('progressWrap').style.display = 'block';
    document.getElementById('progressBar').style.width = '100%';
    transitionToStep(document.getElementById('step4'), () => updateUrgencyIndicator(state.urgent));
}

function updateProgress() {
    const total = FLOW[state.branch].questions.length + 1;
    const current = state.questionIndex + 1;
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = `${Math.round((current / total) * 100)}%`;
}

function transitionToStep(target, onComplete = null) {
    if (!target) return;
    const current = document.querySelector('.quiz-step.active');
    clearTimeout(state.transitionTimer);
    if (current === target) {
        sendAutoHeight();
        if (onComplete) onComplete();
        return;
    }
    if (current) { current.classList.remove('active'); current.classList.add('is-leaving'); }
    document.querySelectorAll('.quiz-step').forEach(step => {
        if (step !== current && step !== target) step.classList.remove('active', 'is-leaving');
    });
    const completeTransition = () => {
        if (current) current.classList.remove('is-leaving');
        target.classList.add('active');
        sendAutoHeight();
        const focus = target.querySelector('button, input, textarea');
        if (focus) focus.focus({ preventScroll: true });
        if (onComplete) onComplete();
    };
    if (prefersReducedMotion()) {
        completeTransition();
        return;
    }
    state.transitionTimer = setTimeout(completeTransition, 220);
}

function goToStep(step) {
    if (step === 1) restartQuiz();
}

function restartQuiz() {
    clearTimeout(state.analysisTimer);
    clearInterval(state.analysisStatusTimer);
    Object.assign(state, { branch: null, questionIndex: 0, answers: [], tags: [], urgent: false, personType: null, valueCode: null, valueLabel: null, outcome: null, selectedOptions: [] });
    setContactVisibility(false);
    document.getElementById('progressWrap').style.display = 'block';
    document.getElementById('progressBar').style.width = '10%';
    transitionToStep(document.getElementById('step1'));
}

function applyWhatsAppMask(input) {
    if (state.branch === 'exterior') {
        input.value = input.value.replace(/[^\d+()\s-]/g, '').slice(0, 18);
        return;
    }
    let value = input.value.replace(/\D/g, '').slice(0, 11);
    if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    else if (value.length > 6) value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    else if (value.length > 2) value = value.replace(/^(\d{2})(\d*)$/, '($1) $2');
    else if (value.length) value = '(' + value;
    input.value = value;
}

function applyDdiMask(input) {
    const digits = input.value.replace(/\D/g, '').slice(0, 4);
    input.value = '+' + digits;
}

function buildLeadWhatsapp(rawNumber, rawDdi = '+55', branch = 'empresa') {
    let number = String(rawNumber || '').replace(/\D/g, '');
    const country = branch === 'exterior' ? (String(rawDdi || '').replace(/\D/g, '').slice(0, 4) || '55') : '55';
    const hasCountryInNumber = String(rawNumber || '').trim().startsWith('+') || number.length > 11;
    if (hasCountryInNumber && number.startsWith(country)) number = number.slice(country.length);
    if (branch === 'exterior') number = number.replace(/^0+/, '');
    return country + number;
}

function createEventId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return 'evt_' + globalThis.crypto.randomUUID();
    return 'evt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function getUtmAttribution() {
    const params = new URLSearchParams(location.search);
    return {
        utm_source: params.get('utm_source') || null,
        utm_medium: params.get('utm_medium') || null,
        utm_campaign: params.get('utm_campaign') || null
    };
}

function getBranchMetadata() {
    const branch = FLOW[state.branch];
    return {
        branch: state.branch || null,
        branch_label: branch ? branch.label : null,
        urgent: Boolean(state.urgent),
        tags: [...new Set(state.tags)],
        value_range: state.valueLabel || null
    };
}

function buildLeadPayload(contact) {
    const timestamp = new Date().toISOString();
    return {
        event_type: 'lead_submission',
        session_id: state.sessionId,
        event_id: createEventId(),
        timestamp,
        ...getBranchMetadata(),
        answers: state.answers,
        ...getUtmAttribution(),
        consent_version: CONSENT_VERSION,
        consent_timestamp: timestamp,
        channel: 'web_form',
        channel_user_id: null,
        name: contact.name,
        whatsapp: contact.whatsapp,
        city: contact.city,
        state: contact.state,
        contact_period: contact.contactPeriod
    };
}

function buildAnalyticsPayload(step) {
    const metadata = getBranchMetadata();
    const tags = step ? [...new Set([...metadata.tags, step])] : metadata.tags;
    return {
        event_type: 'analytics',
        session_id: state.sessionId,
        event_id: createEventId(),
        timestamp: new Date().toISOString(),
        ...metadata,
        tags,
        ...getUtmAttribution()
    };
}

function isWebhookConfigured() {
    try {
        const url = new URL(N8N_WEBHOOK_URL);
        return url.protocol === 'https:' && !url.hostname.endsWith('seu-dominio.com');
    } catch (_) {
        return false;
    }
}

async function sendEvent(payload) {
    if (!isWebhookConfigured() || typeof fetch !== 'function') return false;
    try {
        await fetch(N8N_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        return true;
    } catch (error) {
        console.warn('Falha ao enviar evento:', error);
        return false;
    }
}

function sendAnalyticsEvent(step) {
    if (!isWebhookConfigured()) return false;
    const payload = buildAnalyticsPayload(step);
    if (navigator.sendBeacon) return navigator.sendBeacon(N8N_WEBHOOK_URL, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    return sendEvent(payload);
}

function buildWhatsappHandoff(contact) {
    const branch = FLOW[state.branch];
    const message = `Olá, Dra. Ana Magalhães!\n\nRamo: ${branch.label}\nUrgência: ${state.urgent ? 'Sim' : 'Não'}\nNome: ${contact.name}\nCidade/UF: ${contact.city}/${contact.state}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

async function handleLeadSubmit(event) {
    event.preventDefault();
    if (isDismissedOutcome(state.outcome)) return;
    const nome = document.getElementById('nome').value.trim();
    const rawWhatsapp = document.getElementById('whatsapp').value;
    const whatsappDigits = rawWhatsapp.replace(/\D/g, '');
    const ddi = document.getElementById('ddi').value;
    const cidade = document.getElementById('cidade').value.trim();
    const estado = document.getElementById('estado').value.trim().toUpperCase();
    const horario = document.getElementById('horario').value;
    const consent = document.getElementById('consentimento').checked;
    const minimumPhoneDigits = state.branch === 'exterior' ? 6 : 10;
    if (!nome || whatsappDigits.length < minimumPhoneDigits || !cidade || estado.length !== 2 || !horario || !consent) return;
    const contact = {
        name: nome,
        whatsapp: buildLeadWhatsapp(rawWhatsapp, ddi, state.branch),
        city: cidade,
        state: estado,
        contactPeriod: horario
    };
    const button = document.getElementById('btnSubmit');
    if (button) {
        button.disabled = true;
        const label = button.querySelector('span');
        if (label) label.textContent = 'Encaminhando seus dados...';
    }
    sendEvent(buildLeadPayload(contact)).catch(error => console.warn('Falha ao iniciar envio do evento:', error));
    window.location.href = buildWhatsappHandoff(contact);
}

function sendAutoHeight() {
    const container = document.getElementById('quizContainer');
    if (container) window.parent.postMessage({ quizHeight: container.offsetHeight + 40, rbQuizHeight: container.offsetHeight + 40 }, '*');
}
