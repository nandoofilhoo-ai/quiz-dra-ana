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
    detalheOrigem: null,
    faixaValor: null,
    isQualificado: true,
    motivoDesqualificacao: null,
    transitionTimer: null,
    analysisTimer: null,
    analysisStatusTimer: null
};

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

        // Exibir opção do Laudo R$ 150 caso o valor seja intermediário/revisional
        const laudoBox = document.getElementById('laudoBox');
        if (state.dorTipoCode === 'juros' && code === '<2k') {
            if (laudoBox) laudoBox.style.display = 'block';
        } else {
            if (laudoBox) laudoBox.style.display = 'none';
        }

        showAnalysisScreen('qualified');
    }
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
