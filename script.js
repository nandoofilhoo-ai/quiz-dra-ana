/**
 * QUIZ BANCÁRIO INTERATIVO — Dra. Ana Maria Magalhães
 * Lógica de Negócio, Filtros de Qualificação, Telemetria & WhatsApp Handoff
 */

// Global Config
const N8N_WEBHOOK_URL = 'https://n8n.seu-dominio.com/webhook/quiz-events'; // Substituir pelo endpoint do n8n
const WHATSAPP_NUMBER = '5524992331416'; // Número de destino oficial da Dra. Ana Maria Magalhães

// State Management
const state = {
    sessionId: generateSessionId(),
    currentStep: 1,
    dorPrincipal: null,
    dorTipoCode: null,
    perfil: 'empresa',
    detalheOrigem: null,
    faixaValor: null,
    isQualificado: true,
    motivoDesqualificacao: null,
    transitionTimer: null,
    analysisTimer: null,
    analysisStatusTimer: null
};

function resolveOutcome(valueCode) {
    const answers = (state.branchAnswers || []).join(' | ');
    if (/^Tenho$/i.test(answers) || /já tem advogado nesse processo/i.test(answers)) return 'ja_tem_advogado';
    if (/outra origem/i.test(answers)) return 'fora_do_bancario';
    if (/devolveu tudo/i.test(answers)) return 'prejuizo_devolvido';
    if (/Até R\$ 30 mil/i.test(answers)) return 'golpe_baixo_valor';
    if (state.dorTipoCode !== 'servidor' && (valueCode === 'under_50k' || valueCode === '50_100k')) return 'laudo_offer';
    return 'qualified';
}

function branchNeedsValue() {
    return ['processo', 'recebiveis', 'empresa_endividada', 'avalista', 'imovel'].includes(state.dorTipoCode);
}

function optionIcon(label) {
    const text = String(label || '').toLowerCase();
    if (/conta|saldo|bloqueio/.test(text)) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>';
    if (/empresa|capital|dívida|contrato|cobrança|processo|documento/.test(text)) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V6l8-3 8 3v14M2 20h20M8 10h1M15 10h1M8 14h1M15 14h1"/></svg>';
    if (/imóvel|imovel|patrimônio|bem/.test(text)) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 11 9-7 9 7M5 10v10h14V10M9 20v-5h6v5"/></svg>';
    if (/golpe|pix|dados|banco|devol/.test(text)) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2M8 3l-2 2M16 3l2 2"/></svg>';
    if (/servidor|contracheque|desconto/.test(text)) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>';
    if (/sócio|avalista|fiador|pessoal/.test(text)) return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0M18 5l3 3-3 3"/></svg>';
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>';
}

// Auto Initialize
document.addEventListener('DOMContentLoaded', () => {
    sendAnalyticsEvent(1);
    sendAutoHeight();

    // Auto-Resize iFrame Observer
    const quizContainer = document.getElementById('quizContainer');
    if (quizContainer) {
        const resizeObserver = new ResizeObserver(() => {
            sendAutoHeight();
        });
        resizeObserver.observe(quizContainer);
    }
});

// Helper: Session ID Generator
function generateSessionId() {
    const stored = sessionStorage.getItem('quiz_session_id');
    if (stored) return stored;
    const newId = 'sess_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    sessionStorage.setItem('quiz_session_id', newId);
    return newId;
}

// Emite a altura do Quiz para o iFrame pai via postMessage
function sendAutoHeight() {
    const container = document.getElementById('quizContainer');
    if (container) {
        const height = container.offsetHeight + 40;
        window.parent.postMessage({ quizHeight: height, rbQuizHeight: height }, '*');
    }
}

// Telemetria via sendBeacon / fetch
function sendAnalyticsEvent(stepNumber) {
    const payload = {
        event_type: 'analytics',
        sessionId: state.sessionId,
        step: stepNumber,
        dor: state.dorPrincipal || 'inicio',
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
        navigator.sendBeacon(N8N_WEBHOOK_URL, blob);
    } else {
        fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true
        }).catch(err => console.warn('Erro ao enviar analytics:', err));
    }
}

// Handler Principal de Seleção de Opções
function handleOptionSelect(step, label, code) {
    if (step === 1) {
        state.dorPrincipal = label;
        state.dorTipoCode = code;

        // REGRA DE FILTRO 1: Busca e Apreensão sem reserva -> DESQUALIFICA
        if (code === 'busca_apreensao') {
            showAnalysisScreen('busca_apreensao');
            return;
        }

        // REGRA DE FILTRO 2: Superendividamento Geral -> DESQUALIFICA
        if (code === 'superendividamento') {
            showAnalysisScreen('superendividamento');
            return;
        }

        // Configurar as opções dinâmicas da Etapa 2 conforme a Dor da Etapa 1
        setupStep2Options(code);
        goToStep(2);
    } 
    else if (step === 2) {
        state.detalheOrigem = label;

        // REGRA DE FILTRO 3: RMC/RCC Exclusivo -> Alerta / Desqualifica conforme regra do escritório
        if (code === 'rmc_only') {
            showAnalysisScreen('rmc_only');
            return;
        }

        goToStep(3);
    } 
    else if (step === 3) {
        state.faixaValor = label;

        // Atualizar Resumo no Formulário Qualificado
        document.getElementById('sumProblema').textContent = state.dorPrincipal;
        document.getElementById('sumDetalhe').textContent = state.detalheOrigem;
        document.getElementById('sumValor').textContent = state.faixaValor;

        // A oferta de laudo é definida pelo fluxo revisado abaixo.
        const laudoBox = document.getElementById('laudoBox');
        if (state.dorTipoCode === 'juros' && code === '<2k') {
            if (laudoBox) laudoBox.style.display = 'block';
        } else {
            if (laudoBox) laudoBox.style.display = 'none';
        }

        showAnalysisScreen('qualified');
    }
}

function setProfile(profile, button) {
    state.perfil = profile;
    document.querySelectorAll('.profile-btn').forEach(item => item.classList.remove('is-active'));
    if (button) button.classList.add('is-active');
    const personalIndexes = new Set([5, 6, 7, 8, 9]);
    document.querySelectorAll('#entryOptions > .opt').forEach((item, index) => {
        item.hidden = profile === 'pessoal' && !personalIndexes.has(index);
        item.style.display = profile === 'pessoal' && !personalIndexes.has(index) ? 'none' : '';
    });
    const title = document.querySelector('#step1 .q-title');
    if (title) title.textContent = profile === 'empresa'
        ? 'Qual situação bancária descreve melhor a sua empresa?'
        : 'Qual situação bancária descreve melhor o seu caso?';
}

function renderBusinessQuestion() {
    const questions = BUSINESS_BRANCH_QUESTIONS[state.dorTipoCode] || BUSINESS_BRANCH_QUESTIONS.outro;
    const index = state.branchQuestionIndex || 0;
    const current = questions[index];
    const title = document.getElementById('step2Title');
    const help = document.getElementById('step2Help');
    const container = document.getElementById('step2Options');
    if (!current || !container) return;
    title.textContent = current[0];
    help.textContent = `Pergunta ${index + 1} de ${questions.length}. Escolha a opção mais próxima.`;
    if (state.dorTipoCode === 'outro' && index === 2) {
        container.innerHTML = '<div class="free-response"><textarea id="freeCase" maxlength="600" placeholder="Escreva brevemente o que aconteceu."></textarea><button class="free-submit" type="button" onclick="submitFreeCase()">Continuar</button></div>';
        return;
    }
    container.innerHTML = current[1].map((label, optionIndex) => {
        const displayLabel = compactButtonLabel(label);
        return `
        <button class="opt" onclick="handleOptionSelect(2, '${label.replace(/'/g, "\\'")}', 'answer_${index}_${optionIndex}')">
            <div class="opt-ico"><span>${String(optionIndex + 1).padStart(2, '0')}</span></div>
            <div class="opt-txt"><strong>${displayLabel}</strong><span>Toque para continuar com a triagem.</span></div>
            <span class="opt-arrow">→</span>
        </button>`;
    }).join('');
}

function compactButtonLabel(label) {
    const labels = {
        'Cobrança para pagar em poucos dias': 'Cobrança urgente',
        'Aviso de penhora ou bloqueio': 'Penhora ou bloqueio',
        'Outro documento do processo': 'Outro documento',
        'Há menos de 15 dias': 'Menos de 15 dias',
        'Há mais de 15 dias': 'Mais de 15 dias',
        'A Justiça, por causa de um processo': 'Bloqueio judicial',
        'Aplicação ou saldo travado': 'Saldo travado',
        'Cheque especial ou conta garantida': 'Cheque especial',
        'Já renegociei e não consigo pagar': 'Renegociei e não pago',
        'Recebi uma notificação': 'Recebi notificação',
        'Passei dados ou instalei aplicativo': 'Passei dados ou app',
        'O banco negou a contestação': 'Banco negou',
        'Preciso enviar dinheiro para a família': 'Enviar à família',
        'Quero comprar ou proteger patrimônio no Brasil': 'Patrimônio no Brasil',
        'Outro assunto com banco': 'Outro assunto bancário'
    };
    return labels[label] || label;
}

function submitFreeCase() {
    const field = document.getElementById('freeCase');
    const value = field ? field.value.trim() : '';
    if (!value) {
        if (field) field.focus();
        return;
    }
    state.branchAnswers.push(value);
    state.detalheOrigem = value;
    setupValueOptions();
    goToStep(3);
}

function isUrgentAnswer(label) {
    return /hoje|ontem|menos de 15 dias|nesta semana|mais de 60%|praticamente tudo|judicialmente/i.test(label || '');
}

function handleOptionSelect(step, label, code) {
    if (step === 1) {
        state.dorPrincipal = label;
        state.dorTipoCode = code;
        state.branchQuestionIndex = 0;
        state.branchAnswers = [];
        renderBusinessQuestion();
        goToStep(2);
        return;
    }
    if (step === 2) {
        state.branchAnswers.push(label);
        state.detalheOrigem = label;
        state.urgente = Boolean(state.urgente || isUrgentAnswer(label));
        if (state.dorTipoCode === 'golpe_central' && /até R\$ 30 mil/i.test(label)) state.golpeBaixoValor = true;
        if (state.dorTipoCode === 'golpe_central' && /devolveu tudo/i.test(label)) state.bancoDevolveuTudo = true;
        if (state.dorTipoCode === 'processo' && /^Tenho$/i.test(label)) state.jaTemAdvogado = true;
        if (state.dorTipoCode === 'conta_bloqueada' && /outra origem/i.test(label)) state.foraDoBancario = true;
        const questions = BUSINESS_BRANCH_QUESTIONS[state.dorTipoCode] || BUSINESS_BRANCH_QUESTIONS.outro;
        state.branchQuestionIndex = (state.branchQuestionIndex || 0) + 1;
        if (state.branchQuestionIndex < questions.length) {
            renderBusinessQuestion();
            sendAutoHeight();
            return;
        }
        if (branchNeedsValue()) {
            setupValueOptions();
            goToStep(3);
        } else {
            state.faixaValor = state.branchAnswers.find(answer => /R\$|mil|acima|não sei/i.test(answer)) || 'Não informado';
            showAnalysisScreen(resolveOutcome('no_value'));
        }
        return;
    }
    if (step === 3) {
        state.faixaValor = label;
        const sumProblema = document.getElementById('sumProblema');
        const sumDetalhe = document.getElementById('sumDetalhe');
        const sumValor = document.getElementById('sumValor');
        if (sumProblema) sumProblema.textContent = state.dorPrincipal;
        if (sumDetalhe) sumDetalhe.textContent = state.branchAnswers.join(' · ');
        if (sumValor) sumValor.textContent = state.faixaValor;
        let outcome = 'qualified';
        if (state.jaTemAdvogado) outcome = 'ja_tem_advogado';
        else if (state.foraDoBancario) outcome = 'fora_do_bancario';
        else if (state.bancoDevolveuTudo) outcome = 'prejuizo_devolvido';
        else if (state.golpeBaixoValor) outcome = 'golpe_baixo_valor';
        else if (code === 'under_50k' || code === '50_100k') outcome = 'laudo_offer';
        showAnalysisScreen(outcome);
    }
}

function showDisqualificationScreen(reasonCode) {
    state.isQualificado = false;
    state.motivoDesqualificacao = reasonCode;
    const progressWrap = document.getElementById('progressWrap');
    if (progressWrap) progressWrap.style.display = 'none';
    const disqStep = document.getElementById('disqualifiedStep');
    const disqTitle = document.getElementById('disqTitle');
    const disqLead = document.getElementById('disqLead');
    const disqContent = document.getElementById('disqContent');
    const messages = {
        laudo_offer: ['Uma análise técnica pode ser o melhor primeiro passo', 'Pelo valor informado, o atendimento começa com uma análise do contrato antes de uma ação judicial.', '<p>O laudo mostra possíveis cobranças indevidas e pode servir de base para negociar com o banco.</p><button class="btn-restart" type="button" onclick="acceptLaudo()">Quero saber como funciona</button>'],
        golpe_baixo_valor: ['O prejuízo informado está abaixo da faixa de atendimento', 'Para manter o foco em casos de maior complexidade, não seguimos com atendimento jurídico nessa faixa.', '<p>Registre a ocorrência, conteste a operação no banco e procure o consumidor.gov.br ou o Procon.</p>'],
        prejuizo_devolvido: ['O banco já devolveu o valor informado', 'Nesse cenário, não há prejuízo a recuperar neste momento.', '<p>Se perceber que faltou alguma parte, refaça a triagem com os dados atualizados.</p>'],
        ja_tem_advogado: ['Você já tem advogado no processo', 'O caminho mais seguro é conversar com o profissional que já acompanha os prazos e documentos.', '<p>Se precisar de uma segunda opinião, leve todos os documentos ao atendimento.</p>'],
        fora_do_bancario: ['A origem do bloqueio parece estar fora do bancário', 'O fluxo identificou uma possível origem trabalhista, fiscal ou diferente de uma dívida bancária.', '<p>A equipe pode avaliar o contexto, mas esse caso não entra na prioridade bancária automática.</p>']
    };
    const message = messages[reasonCode] || ['Vamos revisar sua situação', 'A equipe precisa entender melhor os documentos antes de indicar o próximo passo.', '<p>Separe contratos, extratos, notificações e comprovantes relacionados ao caso.</p>'];
    disqTitle.textContent = message[0];
    disqLead.textContent = message[1];
    disqContent.innerHTML = message[2];
    if (disqStep) transitionToStep(disqStep);
    sendAnalyticsEvent('disqualified_' + reasonCode);
    sendAutoHeight();
}

function acceptLaudo() {
    const laudoBox = document.getElementById('laudoBox');
    const successTitle = document.getElementById('successTitle');
    const successLead = document.getElementById('successLead');
    if (laudoBox) laudoBox.style.display = 'block';
    if (successTitle) successTitle.innerHTML = 'Análise técnica do seu contrato.';
    if (successLead) successLead.textContent = 'Deixe seus dados para receber as informações sobre o laudo e os próximos passos.';
    const progressWrap = document.getElementById('progressWrap');
    if (progressWrap) progressWrap.style.display = 'block';
    goToStep(4);
}

async function handleLeadSubmit(event) {
    event.preventDefault();
    const btnSubmit = document.getElementById('btnSubmit');
    const nome = document.getElementById('nome').value.trim();
    const rawWhatsapp = document.getElementById('whatsapp').value.replace(/\D/g, '');
    const cidade = document.getElementById('cidade').value.trim();
    const estado = document.getElementById('estado').value.trim().toUpperCase();
    const horario = document.getElementById('horario').value;
    if (!nome || rawWhatsapp.length < 10 || !cidade || estado.length !== 2 || !horario || !document.getElementById('consentimento').checked) return;
    const formattedWhatsapp = rawWhatsapp.startsWith('55') ? rawWhatsapp : '55' + rawWhatsapp;
    btnSubmit.disabled = true;
    btnSubmit.querySelector('span').textContent = 'Encaminhando seus dados...';
    const payload = {
        event_type: 'lead_submission', sessionId: state.sessionId, nome, whatsapp: formattedWhatsapp,
        perfil: state.perfil || 'empresa', ramo: state.dorTipoCode, problema: state.dorPrincipal,
        respostas: state.branchAnswers || [], detalhe_origem: state.detalheOrigem, valor_divida: state.faixaValor,
        urgente: Boolean(state.urgente), cidade, estado, melhor_horario: horario,
        consentimento_lgpd: true, timestamp: new Date().toISOString()
    };
    try { await fetch(N8N_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch (error) { console.warn('Erro ao enviar lead para o n8n:', error); }
    const textMsg = encodeURIComponent(`Olá, Dra. Ana Maria Magalhães! Realizei a triagem bancária.\n\nNome: ${nome}\nPerfil: ${payload.perfil}\nRamo: ${state.dorPrincipal}\nRespostas: ${payload.respostas.join(' | ')}\nValor: ${state.faixaValor}\nUrgente: ${payload.urgente ? 'Sim' : 'Não'}\nCidade/UF: ${cidade}/${estado}\nMelhor horário: ${horario}`);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${textMsg}`;
    try { window.top.location.href = waUrl; } catch (e) { window.location.href = waUrl; }
}

// Última camada de renderização: inclui resposta livre no ramo "outro".
function renderBusinessQuestion() {
    const questions = BUSINESS_BRANCH_QUESTIONS[state.dorTipoCode] || BUSINESS_BRANCH_QUESTIONS.outro;
    const index = state.branchQuestionIndex || 0;
    const current = questions[index];
    const title = document.getElementById('step2Title');
    const help = document.getElementById('step2Help');
    const container = document.getElementById('step2Options');
    if (!current || !container) return;
    title.textContent = current[0];
    help.textContent = `Pergunta ${index + 1} de ${questions.length}. Escolha a opção mais próxima.`;
    if (state.dorTipoCode === 'outro' && index === 2) {
        container.innerHTML = '<div class="free-response"><textarea id="freeCase" maxlength="600" placeholder="Escreva brevemente o que aconteceu."></textarea><button class="free-submit" type="button" onclick="submitFreeCase()">Continuar</button></div>';
        return;
    }
    container.innerHTML = current[1].map((label, optionIndex) => {
        const displayLabel = compactButtonLabel(label);
        return `<button class="opt" onclick="handleOptionSelect(2, '${label.replace(/'/g, "\\'")}', 'answer_${index}_${optionIndex}')"><div class="opt-ico">${optionIcon(label)}</div><div class="opt-txt"><strong>${displayLabel}</strong><span>Toque para continuar com a triagem.</span></div><span class="opt-arrow">→</span></button>`;
    }).join('');
}

// Monta dinamicamente as opções da Etapa 2
function setupStep2Options(code) {
    const title = document.getElementById('step2Title');
    const help = document.getElementById('step2Help');
    const optsContainer = document.getElementById('step2Options');

    optsContainer.innerHTML = '';

    if (code === 'consignado') {
        title.textContent = 'Onde está sendo realizado o desconto indevido?';
        help.textContent = 'Selecione a origem do benefício ou conta em que o empréstimo não autorizado foi lançado.';
        
        optsContainer.innerHTML = `
            <button class="opt" onclick="handleOptionSelect(2, 'Benefício do INSS (Aposentadoria / Pensão)', 'inss')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                <div class="opt-txt"><strong>Benefício do INSS</strong><span>Aposentadorias, pensões por morte ou auxílios do INSS.</span></div>
                <span class="opt-arrow">→</span>
            </button>
            <button class="opt" onclick="handleOptionSelect(2, 'Contracheque / Folha de Pagamento', 'folha')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                <div class="opt-txt"><strong>Contracheque / Servidor Público</strong><span>Desconto em folha de pagamento de servidor ou celetista.</span></div>
                <span class="opt-arrow">→</span>
            </button>
            <button class="opt" onclick="handleOptionSelect(2, 'Debitado na Conta Corrente / Poupança', 'conta')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
                <div class="opt-txt"><strong>Conta Corrente ou Poupança</strong><span>Lançamentos automáticos direto no saldo bancário.</span></div>
                <span class="opt-arrow">→</span>
            </button>
            <button class="opt warning" onclick="handleOptionSelect(2, 'Apenas Cartão Consignado RMC/RCC', 'rmc_only')">
                <div class="opt-ico alert"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg></div>
                <div class="opt-txt"><strong>Apenas Reserva de Margem RMC / RCC</strong><span>Somente desconto de margem de cartão consignado sem outro valor.</span></div>
                <span class="opt-arrow">→</span>
            </button>
        `;
    } 
    else if (code === 'golpe') {
        title.textContent = 'Qual foi a modalidade do golpe enfrentado?';
        help.textContent = 'Identifique como os fraudadores agiram para traçarmos a responsabilidade da instituição financeira.';

        optsContainer.innerHTML = `
            <button class="opt" onclick="handleOptionSelect(2, 'Golpe do Pix / Transferência Enganosa', 'pix')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
                <div class="opt-txt"><strong>Golpe do Pix / Falso Vendedor</strong><span>Transferência efetuada após engano, compra falsa ou engenharia social.</span></div>
                <span class="opt-arrow">→</span>
            </button>
            <button class="opt" onclick="handleOptionSelect(2, 'Golpe da Falsa Central / Acesso Remoto', 'central')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                <div class="opt-txt"><strong>Falsa Central Bancária / Ligação</strong><span>Ligação simulando o banco induzindo a procedimentos ou instalação de apps.</span></div>
                <span class="opt-arrow">→</span>
            </button>
            <button class="opt" onclick="handleOptionSelect(2, 'Invasão de Conta / Clonagem WhatsApp', 'invasao')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg></div>
                <div class="opt-txt"><strong>Invasão de Conta ou App Bancário</strong><span>Acesso não autorizado ao aplicativo ou pedido de dinheiro em seu nome.</span></div>
                <span class="opt-arrow">→</span>
            </button>
            <button class="opt" onclick="handleOptionSelect(2, 'Boleto Falso ou Adulterado', 'boleto')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                <div class="opt-txt"><strong>Boleto Falso / Código Adulterado</strong><span>Pagamento de boleto com beneficiário alterado por fraude.</span></div>
                <span class="opt-arrow">→</span>
            </button>
        `;
    } 
    else if (code === 'exterior') {
        title.textContent = 'Qual é a sua situação no exterior e com os bancos no Brasil?';
        help.textContent = 'Entenda a relação de seu patrimônio ou de seus familiares diante dos bancos no Brasil.';

        optsContainer.innerHTML = `
            <button class="opt" onclick="handleOptionSelect(2, 'Dívidas no Brasil que podem afetar patrimônio ou familiares', 'divida_brasil')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11"/></svg></div>
                <div class="opt-txt"><strong>Dívidas no Brasil e Risco Familiar</strong><span>Deixou empréstimos no Brasil e teme penhora ou incômodo aos pais/familiares.</span></div>
                <span class="opt-arrow">→</span>
            </button>
            <button class="opt" onclick="handleOptionSelect(2, 'Dificuldade com Contas e Remessas Internacionais', 'remessa')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></svg></div>
                <div class="opt-txt"><strong>Bloqueio de Saldo ou Remessa do Exterior</strong><span>Valores travados ao tentar enviar auxílio ao Brasil ou movimentar conta.</span></div>
                <span class="opt-arrow">→</span>
            </button>
        `;
    } 
    else { // juros / revisional
        title.textContent = 'Qual é a modalidade do contrato ou financiamento?';
        help.textContent = 'Selecione o tipo de contrato em que deseja avaliar a cobrança de juros e encargos.';

        optsContainer.innerHTML = `
            <button class="opt" onclick="handleOptionSelect(2, 'Financiamento de Veículo / Carro / Moto', 'veiculo')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12.1 1 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>
                <div class="opt-txt"><strong>Financiamento de Veículo</strong><span>Contrato de alienação fiduciária com parcelas altas.</span></div>
                <span class="opt-arrow">→</span>
            </button>
            <button class="opt" onclick="handleOptionSelect(2, 'Empréstimo Pessoal / Cheque Especial / Capital de Giro', 'pessoal')">
                <div class="opt-ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
                <div class="opt-txt"><strong>Empréstimo Pessoal / Cheque Especial</strong><span>Crédito direto ao consumidor com juros acumulados elevados.</span></div>
                <span class="opt-arrow">→</span>
            </button>
        `;
    }
}

// Transição entre telas de etapas
function goToStep(stepNumber) {
    state.currentStep = stepNumber;
    const target = document.getElementById(`step${stepNumber}`);
    if (!target) return;

    // Atualizar Barra de Progresso
    const progressBar = document.getElementById('progressBar');
    const stepLabel = document.getElementById('stepLabel');
    const pctLabel = document.getElementById('pctLabel');

    const percents = { 1: '25%', 2: '50%', 3: '75%', 4: '100%' };
    if (progressBar) progressBar.style.width = percents[stepNumber] || '25%';
    if (stepLabel) stepLabel.textContent = `Pergunta ${stepNumber} de 4`;
    if (pctLabel) pctLabel.textContent = percents[stepNumber] || '25%';

    sendAnalyticsEvent(stepNumber);
    transitionToStep(target);
}

function transitionToStep(target) {
    const current = document.querySelector('.quiz-step.active');
    clearTimeout(state.transitionTimer);

    if (current === target) {
        sendAutoHeight();
        return;
    }

    if (current) {
        current.classList.remove('active');
        current.classList.add('is-leaving');
    }

    document.querySelectorAll('.quiz-step').forEach(step => {
        if (step !== current && step !== target) step.classList.remove('active', 'is-leaving');
    });

    state.transitionTimer = setTimeout(() => {
        if (current) current.classList.remove('is-leaving');
        target.classList.add('active');
        sendAutoHeight();

        const focusTarget = target.querySelector('button, input');
        if (focusTarget) focusTarget.focus({ preventScroll: true });
    }, 220);
}

function showAnalysisScreen(outcome) {
    const analysisStep = document.getElementById('analysisStep');
    if (!analysisStep) {
        outcome === 'qualified' ? goToStep(4) : showDisqualificationScreen(outcome);
        return;
    }

    clearTimeout(state.analysisTimer);
    clearInterval(state.analysisStatusTimer);
    state.currentStep = 'analysis';

    const progressWrap = document.getElementById('progressWrap');
    const progressBar = document.getElementById('progressBar');
    if (progressWrap) progressWrap.style.display = 'block';
    if (progressBar) progressBar.style.width = '100%';

    const analysisTitle = document.getElementById('analysisTitle');
    const analysisDetail = document.getElementById('analysisDetail');
    const analysisStatus = document.getElementById('analysisStatus');
    if (analysisTitle) analysisTitle.textContent = 'Analisando suas respostas';
    if (analysisDetail) analysisDetail.textContent = 'Estamos organizando as informações para preparar a orientação mais adequada.';
    if (analysisStatus) analysisStatus.textContent = 'Lendo suas respostas';

    if (outcome === 'qualified') {
        const successTitle = document.getElementById('successTitle');
        const successLead = document.getElementById('successLead');
        const messages = {
            processo: ['Boas notícias!<br>O seu caso merece uma análise prioritária.', 'Quando existe processo ou prazo correndo, os documentos e as datas fazem diferença.'],
            conta_bloqueada: ['Podemos analisar o bloqueio da conta da sua empresa.', 'A origem do bloqueio e o destino do dinheiro são os primeiros pontos da análise.'],
            recebiveis: ['Podemos analisar a retenção dos recebíveis da empresa.', 'O contrato, o tipo de recebível e o impacto no caixa orientam o próximo passo.'],
            empresa_endividada: ['Podemos analisar os contratos bancários da sua empresa.', 'Vamos conferir as condições contratadas, os encargos e o impacto no caixa.'],
            avalista: ['Podemos analisar sua responsabilidade no contrato.', 'O que foi assinado e a relação com a empresa definem os pontos da avaliação.'],
            imovel: ['Podemos analisar a situação do financiamento do imóvel.', 'As notificações, parcelas e prazos indicam o caminho adequado para a análise.'],
            golpe_central: ['Podemos analisar o golpe da falsa central.', 'A operação realizada e a resposta do banco serão importantes para a avaliação.'],
            servidor: ['Podemos analisar a sequência de empréstimos e descontos.', 'No caso de servidor, a análise considera as renovações sucessivas e os contratos assinados.'],
            exterior: ['Podemos analisar a situação bancária ligada ao Brasil.', 'A relação entre remessa, dívida e patrimônio será entendida individualmente.'],
            outro: ['Vamos encaminhar seu caso para análise.', 'As informações que você deixou ajudam a equipe a entender o próximo passo.']
        };
        const message = messages[state.dorTipoCode] || messages.outro;
        if (successTitle) successTitle.innerHTML = message[0];
        if (successLead) successLead.textContent = message[1];
        const documents = {
            processo: 'Separe o documento recebido pelo oficial e o contrato da dívida.',
            conta_bloqueada: 'Separe o extrato mostrando o bloqueio e o número do processo, se houver.',
            recebiveis: 'Separe o contrato da dívida e o extrato da maquininha ou conta vinculada.',
            empresa_endividada: 'Separe os contratos das dívidas e os extratos dos últimos 3 meses.',
            avalista: 'Separe o contrato assinado e o contrato social da empresa.',
            imovel: 'Separe o contrato do financiamento e qualquer notificação recebida.',
            golpe_central: 'Separe o boletim de ocorrência, comprovantes e a resposta do banco.',
            servidor: 'Separe o contracheque mais recente e a lista das dívidas ou contratos.',
            exterior: 'Separe documentos da dívida, da remessa ou do patrimônio ligado ao Brasil.',
            outro: 'Separe contratos, extratos, notificações e comprovantes relacionados ao caso.'
        };
        const documentsHint = document.getElementById('documentsHint');
        if (documentsHint) documentsHint.textContent = documents[state.dorTipoCode] || documents.outro;
    }

    transitionToStep(analysisStep);
    sendAnalyticsEvent('analysis_' + outcome);

    const statusMessages = ['Lendo suas respostas', 'Comparando as informações', 'Preparando sua orientação'];
    let statusIndex = 0;
    state.analysisStatusTimer = setInterval(() => {
        statusIndex = (statusIndex + 1) % statusMessages.length;
        if (analysisStatus) {
            analysisStatus.classList.remove('is-changing');
            void analysisStatus.offsetWidth;
            analysisStatus.textContent = statusMessages[statusIndex];
            analysisStatus.classList.add('is-changing');
        }
    }, 620);

    state.analysisTimer = setTimeout(() => {
        clearInterval(state.analysisStatusTimer);
        if (outcome === 'qualified') {
            goToStep(4);
        } else {
            showDisqualificationScreen(outcome);
        }
    }, 1800);
}

// Tela de Não Qualificado com Orientação Transparente (Dra. Ana Maria Rules)
function showDisqualificationScreen(reasonCode) {
    state.isQualificado = false;
    state.motivoDesqualificacao = reasonCode;

    const progressWrap = document.getElementById('progressWrap');
    if (progressWrap) progressWrap.style.display = 'none';

    const disqStep = document.getElementById('disqualifiedStep');
    const disqTitle = document.getElementById('disqTitle');
    const disqLead = document.getElementById('disqLead');
    const disqContent = document.getElementById('disqContent');

    if (reasonCode === 'busca_apreensao') {
        disqTitle.textContent = 'Aviso Importante: Busca e Apreensão de Veículos';
        disqLead.textContent = 'Não atuamos em defesa de veículo já apreendido sem reserva financeira prévia para quitação.';
        disqContent.innerHTML = `
            <p><strong>Orientação da Dra. Ana Maria Magalhães:</strong></p>
            <p>Para atuação jurídica em ações de Busca e Apreensão com carro já recolhido, a legislação exige o depósito integral da dívida vencida. Caso você não possua reserva para quitação imediata, a defesa judicial isolada gera custos sem garantia de recuperação do bem.</p>
            <p>Recomendamos buscar diretamente a Defensoria Pública do seu Estado ou o Juizado Especial para orientações gratuitas.</p>
        `;
    } 
    else if (reasonCode === 'superendividamento') {
        disqTitle.textContent = 'Orientação sobre a Lei do Superendividamento (Lei 14.181/2021)';
        disqLead.textContent = 'No momento, a repactuação geral de todas as dívidas não faz parte da nossa atuação de advocacia privada.';
        disqContent.innerHTML = `
            <p><strong>Canais Públicos e Gratuitos para Repactuação:</strong></p>
            <p>A Lei do Superendividamento garante um processo de conciliação para renegociação em bloco de todas as suas dívidas preservando seu mínimo existencial. Esse serviço é prestado gratuitamente por órgãos oficiais:</p>
            <ul>
                <li><strong>Núcleo de Superendividamento do Procon:</strong> Para audiência de conciliação com todos os credores reunidos.</li>
                <li><strong>Defensoria Pública do Estado:</strong> Para assistência jurídica gratuita em repactuação judicial.</li>
            </ul>
        `;
    }
    else if (reasonCode === 'rmc_only') {
        disqTitle.textContent = 'Aviso sobre Ações Exclusivas de RMC / RCC';
        disqLead.textContent = 'Demandas exclusivamente focadas na margem do Cartão RMC possuem custos de honorários mínimos.';
        disqContent.innerHTML = `
            <p><strong>Informação sobre Atendimento:</strong></p>
            <p>A advocacia privada para revisão isolada de margem de RMC sem outros descontos indevidos exige honorários mínimos contratuais (a partir de R$ 5.000,00 parcelados). Para valores menores, o atendimento presencial no Procon ou Juizado Especial Cível (sem necessidade de advogado) é a via mais vantajosa economicamente.</p>
        `;
    }

    if (disqStep) transitionToStep(disqStep);

    sendAnalyticsEvent('disqualified_' + reasonCode);
    sendAutoHeight();
}

// Reiniciar Quiz
function restartQuiz() {
    state.dorPrincipal = null;
    state.dorTipoCode = null;
    state.detalheOrigem = null;
    state.faixaValor = null;
    state.isQualificado = true;
    state.perfil = 'empresa';
    state.branchAnswers = [];
    state.branchQuestionIndex = 0;
    state.urgente = false;
    state.golpeBaixoValor = false;
    state.bancoDevolveuTudo = false;
    state.jaTemAdvogado = false;
    state.foraDoBancario = false;
    clearTimeout(state.analysisTimer);
    clearInterval(state.analysisStatusTimer);
    clearTimeout(state.transitionTimer);

    const progressWrap = document.getElementById('progressWrap');
    if (progressWrap) progressWrap.style.display = 'block';

    goToStep(1);
}

// Máscara de Formatação do WhatsApp (00) 00000-0000
function applyWhatsAppMask(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);

    if (v.length > 10) {
        v = v.replace(/^(\d\d)(\d\d\d\d\d)(\d\d\d\d)/, '($1) $2-$3');
    } else if (v.length > 6) {
        v = v.replace(/^(\d\d)(\d\d\d\d)(\d\d\d\d)/, '($1) $2-$3');
    } else if (v.length > 2) {
        v = v.replace(/^(\d\d)(\d?)/, '($1) $2');
    } else if (v.length > 0) {
        v = v.replace(/^(\d?)/, '($1');
    }
    input.value = v;
}

// Envio do Formulário Qualificado -> n8n + Direct WhatsApp Handoff
async function handleLeadSubmit(event) {
    event.preventDefault();

    const btnSubmit = document.getElementById('btnSubmit');
    const nome = document.getElementById('nome').value.trim();
    const rawWhatsapp = document.getElementById('whatsapp').value.replace(/\D/g, '');

    if (!nome || rawWhatsapp.length < 10) {
        alert('Por favor, informe seu nome completo e um número de WhatsApp válido com DDD.');
        return;
    }

    const formattedWhatsapp = rawWhatsapp.startsWith('55') ? rawWhatsapp : '55' + rawWhatsapp;

    btnSubmit.disabled = true;
    btnSubmit.querySelector('span').textContent = 'Redirecionando para o WhatsApp...';

    const payload = {
        event_type: 'lead_submission',
        sessionId: state.sessionId,
        nome: nome,
        whatsapp: formattedWhatsapp,
        problema: state.dorPrincipal,
        detalhe_origem: state.detalheOrigem,
        valor_divida: state.faixaValor,
        advogada_responsavel: 'Dra. Ana Maria Magalhães',
        timestamp: new Date().toISOString()
    };

    try {
        await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.warn('Erro ao enviar lead para o n8n:', error);
    }

    // Mensagem formatada especificamente para o atendimento da Dra. Ana Maria Magalhães
    const textMsg = encodeURIComponent(
        `Olá, Dra. Ana Maria Magalhães! Realizei a avaliação de viabilidade no site.\n\n` +
        `*Nome:* ${nome}\n` +
        `*Problema:* ${state.dorPrincipal}\n` +
        `*Detalhamento:* ${state.detalheOrigem}\n` +
        `*Valor Envolvido:* ${state.faixaValor}\n` +
        `*ID da Sessão:* ${state.sessionId}\n\n` +
        `Gostaria de iniciar o atendimento sobre o meu caso.`
    );

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${textMsg}`;

    // Breakout de Top Window para iFrame
    try {
        if (window.top) {
            window.top.location.href = waUrl;
        } else {
            window.location.href = waUrl;
        }
    } catch (e) {
        window.location.href = waUrl;
    }
}

/* Fluxo empresarial revisado conforme briefing da doutora. */
function setupStep2Options(code) {
    const title = document.getElementById('step2Title');
    const help = document.getElementById('step2Help');
    const optsContainer = document.getElementById('step2Options');
    const branches = {
        processo: ['O que você recebeu?', 'Escolha o documento ou aviso mais próximo do que aconteceu.', [['Cobrança para pagar em poucos dias', 'cobranca'], ['Aviso de penhora ou bloqueio', 'penhora'], ['Aviso de leilão', 'leilao'], ['Outro documento do processo', 'outro_processo'], ['Não sei', 'nao_sei']]],
        conta_bloqueada: ['Quem bloqueou a conta?', 'A origem do bloqueio ajuda a definir a próxima análise.', [['A Justiça, por causa de um processo', 'justica'], ['O próprio banco', 'banco'], ['Não sei', 'nao_sei']]],
        recebiveis: ['O que o banco está segurando?', 'Selecione o tipo de valor que deixou de entrar no caixa.', [['Vendas da maquininha', 'maquininha'], ['Duplicatas ou boletos', 'duplicatas'], ['Aplicação ou saldo travado', 'saldo'], ['Não sei', 'nao_sei']]],
        empresa_endividada: ['Qual contrato mais pesa no caixa?', 'O produto bancário aparece aqui para entendermos o contrato.', [['Capital de giro ou Pronampe', 'capital_giro'], ['Cheque especial ou conta garantida', 'cheque_especial'], ['Cartão da empresa', 'cartao_empresa'], ['Outro contrato', 'outro_contrato']]],
        avalista: ['Como você aparece nesse contrato?', 'Queremos entender o vínculo entre a dívida da empresa e o seu patrimônio.', [['Sócio que assinou pela empresa', 'socio'], ['Avalista ou fiador', 'fiador'], ['Não sei', 'nao_sei']]],
        imovel: ['Em que ponto está o financiamento?', 'O momento da cobrança muda os documentos necessários para a análise.', [['Parcelas atrasadas', 'parcelas_atrasadas'], ['Recebi uma notificação', 'notificacao'], ['Falaram em leilão', 'leilao_imovel'], ['Não sei', 'nao_sei']]],
        golpe_central: ['O que aconteceu depois da ligação?', 'A análise depende da operação feita e do retorno do banco.', [['Fiz um Pix ou transferência', 'pix_central'], ['Passei dados ou instalei aplicativo', 'dados_central'], ['O banco negou a contestação', 'negou_contestacao'], ['Não sei', 'nao_sei']]],
        exterior: ['Qual é a situação ligada ao Brasil?', 'Esse atendimento começa pela relação entre a dívida, a remessa e o patrimônio.', [['Preciso enviar dinheiro para a família', 'remessa_familia'], ['Quero comprar ou proteger patrimônio no Brasil', 'patrimonio_brasil'], ['Uma conta ou valor foi bloqueado', 'bloqueio_exterior'], ['Outro caso', 'outro_exterior']]],
        outro: ['Existe processo, bloqueio ou prazo correndo?', 'Mesmo em outro assunto, essa informação ajuda a definir a prioridade.', [['Sim', 'sim'], ['Não', 'nao'], ['Não sei', 'nao_sei']]]
    };
    const branch = branches[code] || branches.outro;
    title.textContent = branch[0];
    help.textContent = branch[1];
    optsContainer.innerHTML = branch[2].map(([label, optionCode], index) => `
        <button class="opt" onclick="handleOptionSelect(2, '${label.replace(/'/g, "\\'")}', '${optionCode}')">
            <div class="opt-ico"><span>${String(index + 1).padStart(2, '0')}</span></div>
            <div class="opt-txt"><strong>${label}</strong><span>Toque para continuar com a triagem.</span></div>
            <span class="opt-arrow">→</span>
        </button>`).join('');
}

function setupValueOptions() {
    const questionCopy = {
        processo: ['Qual o valor que o banco está cobrando?', 'Pode ser uma estimativa do contrato ou da cobrança recebida.'],
        recebiveis: ['Qual o valor total da dívida?', 'Considere o contrato ligado aos recebíveis retidos.'],
        empresa_endividada: ['Qual o valor total das dívidas bancárias?', 'Some os contratos que pressionam o caixa, se souber.'],
        avalista: ['Qual o valor da dívida da empresa?', 'Uma estimativa já ajuda a definir a análise.'],
        imovel: ['Qual o saldo ou valor da dívida?', 'Considere o financiamento e as parcelas em atraso.']
    };
    const copy = questionCopy[state.dorTipoCode] || ['Qual é o valor aproximado envolvido?', 'Uma estimativa já ajuda a definir o próximo passo.'];
    const valueTitle = document.querySelector('#step3 .q-title');
    const valueHelp = document.querySelector('#step3 .q-help');
    if (valueTitle) valueTitle.textContent = copy[0];
    if (valueHelp) valueHelp.textContent = copy[1];
    const options = [
        ['Até R$ 50 mil', 'under_50k', 'Abaixo da régua de ação judicial.'],
        ['R$ 50 mil a R$ 100 mil', '50_100k', 'Faixa para avaliação e definição do próximo passo.'],
        ['R$ 100 mil a R$ 300 mil', '100_300k', 'Faixa de análise prioritária do contrato.'],
        ['R$ 300 mil a R$ 500 mil', '300_500k', 'Valor relevante para análise documental.'],
        ['Acima de R$ 500 mil', 'over_500k', 'Atendimento com prioridade máxima.'],
        ['Não sei informar', 'unknown_value', 'A equipe avalia os documentos depois.']
    ];
    const container = document.getElementById('valueOptions');
    if (!container) return;
    container.innerHTML = options.map(([label, code, detail], index) => `
        <button class="opt" onclick="handleOptionSelect(3, '${label}', '${code}')">
            <div class="opt-ico">${optionIcon(label)}</div>
            <div class="opt-txt"><strong>${label}</strong><span>${detail}</span></div>
            <span class="opt-arrow">→</span>
        </button>`).join('');
}

function handleOptionSelect(step, label, code) {
    if (step === 1) {
        state.dorPrincipal = label;
        state.dorTipoCode = code;
        setupStep2Options(code);
        goToStep(2);
        return;
    }
    if (step === 2) {
        state.detalheOrigem = label;
        setupValueOptions();
        goToStep(3);
        return;
    }
    if (step === 3) {
        state.faixaValor = label;
        const sumProblema = document.getElementById('sumProblema');
        const sumDetalhe = document.getElementById('sumDetalhe');
        const sumValor = document.getElementById('sumValor');
        if (sumProblema) sumProblema.textContent = state.dorPrincipal;
        if (sumDetalhe) sumDetalhe.textContent = state.detalheOrigem;
        if (sumValor) sumValor.textContent = state.faixaValor;
        showAnalysisScreen(resolveOutcome(code));
    }
}

function renderBusinessQuestion() {
    const questions = BUSINESS_BRANCH_QUESTIONS[state.dorTipoCode] || BUSINESS_BRANCH_QUESTIONS.outro;
    const index = state.branchQuestionIndex || 0;
    const current = questions[index];
    const title = document.getElementById('step2Title');
    const help = document.getElementById('step2Help');
    const container = document.getElementById('step2Options');
    if (!current || !container) return;
    title.textContent = current[0];
    help.textContent = `Pergunta ${index + 1} de ${questions.length}. Escolha a opção mais próxima.`;
    if (state.dorTipoCode === 'outro' && index === 2) {
        container.innerHTML = '<div class="free-response"><textarea id="freeCase" maxlength="600" placeholder="Escreva brevemente o que aconteceu."></textarea><button class="free-submit" type="button" onclick="submitFreeCase()">Continuar</button></div>';
        return;
    }
    container.innerHTML = current[1].map((label, optionIndex) => {
        const displayLabel = compactButtonLabel(label);
        return `<button class="opt" onclick="handleOptionSelect(2, '${label.replace(/'/g, "\\'")}', 'answer_${index}_${optionIndex}')"><div class="opt-ico">${optionIcon(label)}</div><div class="opt-txt"><strong>${displayLabel}</strong><span>Toque para continuar com a triagem.</span></div><span class="opt-arrow">→</span></button>`;
    }).join('');
}

function showDisqualificationScreen(reasonCode) {
    state.isQualificado = false;
    state.motivoDesqualificacao = reasonCode;
    const progressWrap = document.getElementById('progressWrap');
    if (progressWrap) progressWrap.style.display = 'none';
    const disqStep = document.getElementById('disqualifiedStep');
    const disqTitle = document.getElementById('disqTitle');
    const disqLead = document.getElementById('disqLead');
    const disqContent = document.getElementById('disqContent');
    const messages = {
        laudo_offer: ['Uma análise técnica pode ser o melhor primeiro passo', 'Pelo valor informado, o atendimento começa com uma análise do contrato antes de uma ação judicial.', '<p>O laudo mostra possíveis cobranças indevidas e pode servir de base para negociar com o banco.</p><button class="btn-restart" type="button" onclick="acceptLaudo()">Quero saber como funciona</button>'],
        below_minimum: ['O valor informado está abaixo da nossa faixa de atuação', 'Para manter o atendimento focado em casos empresariais de maior complexidade, não seguimos com ação judicial nessa faixa.', '<p>Você pode buscar uma solução pelo consumidor.gov.br, Procon ou ouvidoria do banco.</p>'],
        golpe_baixo_valor: ['O prejuízo informado está abaixo da faixa de atendimento', 'Para manter o foco em casos de maior complexidade, não seguimos com atendimento jurídico nessa faixa.', '<p>Registre a ocorrência, conteste a operação no banco e procure o consumidor.gov.br ou o Procon.</p>'],
        prejuizo_devolvido: ['O banco já devolveu o valor informado', 'Nesse cenário, não há prejuízo a recuperar neste momento.', '<p>Se perceber que faltou alguma parte, refaça a triagem com os dados atualizados.</p>'],
        ja_tem_advogado: ['Você já tem advogado no processo', 'O caminho mais seguro é conversar com o profissional que já acompanha os prazos e documentos.', '<p>Se precisar de uma segunda opinião, leve todos os documentos ao atendimento.</p>'],
        fora_do_bancario: ['A origem do bloqueio parece estar fora do bancário', 'O fluxo identificou uma possível origem trabalhista, fiscal ou diferente de uma dívida bancária.', '<p>A equipe pode avaliar o contexto, mas esse caso não entra na prioridade bancária automática.</p>']
    };
    const message = messages[reasonCode] || ['Vamos encaminhar sua situação para uma análise adequada', 'A equipe precisa entender os documentos antes de indicar o próximo passo.', '<p>Separe contratos, extratos, notificações e comprovantes relacionados ao caso.</p>'];
    disqTitle.textContent = message[0];
    disqLead.textContent = message[1];
    disqContent.innerHTML = message[2];
    if (disqStep) transitionToStep(disqStep);
    sendAnalyticsEvent('disqualified_' + reasonCode);
    sendAutoHeight();
}

document.addEventListener('DOMContentLoaded', setupValueOptions);

/* Perguntas qualificadoras por ramo: até quatro aqui, mais a faixa de valor. */
const BUSINESS_BRANCH_QUESTIONS = {
    processo: [
        ['O que você recebeu?', ['Cobrança para pagar em poucos dias', 'Aviso de penhora ou bloqueio', 'Aviso de leilão', 'Outro documento do processo', 'Não sei']],
        ['Quando você recebeu?', ['Hoje ou ontem', 'Há menos de 15 dias', 'Há mais de 15 dias', 'Não lembro']],
        ['Essa dívida é de quem?', ['Da minha empresa', 'Minha, pessoal', 'Sou avalista ou fiador']],
        ['Você já tem advogado nesse processo?', ['Não tenho', 'Tenho, mas quero outra opinião', 'Tenho']]
    ],
    conta_bloqueada: [
        ['Quem bloqueou a conta?', ['A Justiça, por causa de um processo', 'O próprio banco', 'Não sei']],
        ['Quando foi o bloqueio?', ['Hoje ou ontem', 'Nesta semana', 'Há mais de uma semana']],
        ['Quanto ficou bloqueado?', ['Até R$ 20 mil', 'R$ 20 a 100 mil', 'R$ 100 a 500 mil', 'Acima de R$ 500 mil', 'Não sei']],
        ['Esse dinheiro era para quê?', ['Folha de pagamento', 'Fornecedores e impostos', 'Reserva da empresa', 'Outro']],
        ['O bloqueio veio de uma dívida com banco?', ['Sim', 'Não, é de outra origem', 'Não sei']]
    ],
    recebiveis: [
        ['O que o banco está segurando?', ['Vendas da maquininha', 'Duplicatas ou boletos', 'Aplicação ou saldo travado', 'Não sei']],
        ['Isso está ligado a qual dívida?', ['Capital de giro', 'Antecipação de recebíveis', 'Cheque especial ou conta garantida', 'Não sei']],
        ['Quanto do faturamento fica retido?', ['Menos de 30%', 'De 30% a 60%', 'Mais de 60%', 'Praticamente tudo']],
        ['Como estão as parcelas dessa dívida?', ['Em dia', 'Atrasadas', 'Já renegociei e não consigo pagar']]
    ],
    empresa_endividada: [
        ['Qual contrato mais pesa no caixa?', ['Capital de giro ou Pronampe', 'Cheque especial ou conta garantida', 'Cartão da empresa', 'Outro contrato']],
        ['Como estão as parcelas?', ['Em dia', 'Atrasadas', 'Já renegociei e não consigo pagar']],
        ['Existem garantias ou bens envolvidos?', ['Sim, dei um imóvel ou veículo', 'Sim, assinei como sócio ou avalista', 'Não sei', 'Não']],
        ['O banco já fez alguma cobrança formal?', ['Sim, recebi uma notificação', 'Ainda não', 'Não sei']]
    ],
    avalista: [
        ['Como você aparece nesse contrato?', ['Sócio que assinou pela empresa', 'Avalista ou fiador', 'Não sei']],
        ['O banco já está cobrando você?', ['Sim, judicialmente', 'Sim, por cobrança direta', 'Ainda não', 'Não sei']],
        ['A empresa ainda está funcionando?', ['Sim', 'Está paralisada', 'Foi encerrada', 'Não sei']]
    ],
    imovel: [
        ['Em que ponto está o financiamento?', ['Parcelas atrasadas', 'Recebi uma notificação', 'Falaram em leilão', 'Não sei']],
        ['Quando recebeu a notificação?', ['Hoje ou ontem', 'Há menos de 15 dias', 'Há mais de 15 dias', 'Não lembro']],
        ['O imóvel está ligado à empresa?', ['Sim, é da empresa', 'Não, é pessoal', 'Não sei']]
    ],
    golpe_central: [
        ['O que aconteceu depois da ligação?', ['Fiz um Pix ou transferência', 'Passei dados ou instalei aplicativo', 'O banco negou a contestação', 'Não sei']],
        ['Quando aconteceu?', ['Hoje ou ontem', 'Nos últimos 15 dias', 'Há mais de 15 dias', 'Não lembro']],
        ['Qual foi o prejuízo aproximado?', ['Até R$ 30 mil', 'R$ 30 a 100 mil', 'Acima de R$ 100 mil', 'Não sei']],
        ['O que o banco respondeu?', ['Negou a devolução', 'Ainda não respondeu', 'Devolveu uma parte', 'Devolveu tudo']]
    ],
    servidor: [
        ['Qual é a sua renda mensal aproximada?', ['Até R$ 10 mil', 'R$ 10 a 20 mil', 'R$ 20 a 40 mil', 'Acima de R$ 40 mil', 'Não sei']],
        ['O que acontece com os empréstimos?', ['Renovo todo mês', 'Renovo há anos', 'A dívida só aumenta', 'Não sei']],
        ['Onde os descontos aparecem?', ['Contracheque', 'Conta corrente', 'Os dois', 'Não sei']],
        ['Você já tentou resolver com o banco?', ['Sim, sem solução', 'Ainda não', 'Não sei']]
    ],
    exterior: [
        ['Qual é a situação ligada ao Brasil?', ['Preciso enviar dinheiro para a família', 'Quero comprar ou proteger patrimônio no Brasil', 'Uma conta ou valor foi bloqueado', 'Outro caso']],
        ['O problema envolve dívida bancária?', ['Sim, da empresa', 'Sim, pessoal', 'Não sei', 'Não']]
    ],
    outro: [
        ['O problema é com:', ['Dívida da empresa', 'Dívida pessoal', 'Outro assunto com banco']],
        ['Existe processo, bloqueio ou prazo correndo?', ['Sim', 'Não', 'Não sei']],
        ['Conte em uma ou duas frases o que está acontecendo.', []]
    ]
};

function renderBusinessQuestion() {
    const questions = BUSINESS_BRANCH_QUESTIONS[state.dorTipoCode] || BUSINESS_BRANCH_QUESTIONS.outro;
    const index = state.branchQuestionIndex || 0;
    const current = questions[index];
    const title = document.getElementById('step2Title');
    const help = document.getElementById('step2Help');
    const container = document.getElementById('step2Options');
    if (!current || !container) return;
    title.textContent = current[0];
    help.textContent = `Pergunta ${index + 1} de ${questions.length}. Escolha a opção mais próxima.`;
    if (state.dorTipoCode === 'outro' && index === 2) {
        container.innerHTML = '<div class="free-response"><textarea id="freeCase" maxlength="600" placeholder="Escreva brevemente o que aconteceu."></textarea><button class="free-submit" type="button" onclick="submitFreeCase()">Continuar</button></div>';
        return;
    }
    container.innerHTML = current[1].map((label, optionIndex) => {
        const displayLabel = compactButtonLabel(label);
        return `<button class="opt" onclick="handleOptionSelect(2, '${label.replace(/'/g, "\\'")}', 'answer_${index}_${optionIndex}')"><div class="opt-ico">${optionIcon(label)}</div><div class="opt-txt"><strong>${displayLabel}</strong><span>Toque para continuar com a triagem.</span></div><span class="opt-arrow">→</span></button>`;
    }).join('');
}

function handleOptionSelect(step, label, code) {
    if (step === 1) {
        state.dorPrincipal = label;
        state.dorTipoCode = code;
        state.branchQuestionIndex = 0;
        state.branchAnswers = [];
        renderBusinessQuestion();
        goToStep(2);
        return;
    }
    if (step === 2) {
        state.branchAnswers.push(label);
        const questions = BUSINESS_BRANCH_QUESTIONS[state.dorTipoCode] || BUSINESS_BRANCH_QUESTIONS.outro;
        state.detalheOrigem = label;
        state.branchQuestionIndex = (state.branchQuestionIndex || 0) + 1;
        if (state.branchQuestionIndex < questions.length) {
            renderBusinessQuestion();
            sendAutoHeight();
            return;
        }
        if (branchNeedsValue()) {
            setupValueOptions();
            goToStep(3);
        } else {
            state.faixaValor = state.branchAnswers.find(answer => /R\$|mil|acima|não sei/i.test(answer)) || 'Não informado';
            showAnalysisScreen(resolveOutcome('no_value'));
        }
        return;
    }
    if (step === 3) {
        state.faixaValor = label;
        const sumProblema = document.getElementById('sumProblema');
        const sumDetalhe = document.getElementById('sumDetalhe');
        const sumValor = document.getElementById('sumValor');
        if (sumProblema) sumProblema.textContent = state.dorPrincipal;
        if (sumDetalhe) sumDetalhe.textContent = state.branchAnswers.join(' · ');
        if (sumValor) sumValor.textContent = state.faixaValor;
        showAnalysisScreen(resolveOutcome(code));
    }
}
