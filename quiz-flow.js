/**
 * Fluxo de triagem da Dra. Ana Magalhães.
 * Fonte: documento "Fluxo de triagem ManyChat – Direito Bancário".
 * Exceções posteriores confirmadas no WhatsApp:
 * - a opção fora do escopo foi removida;
 * - a frente de dívidas no exterior deve existir.
 */

const N8N_WEBHOOK_URL = 'https://n8n.seu-dominio.com/webhook/quiz-events';
const WHATSAPP_NUMBER = '5524992331416';

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
        label: 'Banco me processou', type: 'empresa_ou_pessoa', icon: 'process', valueQuestion: 3,
        questions: [
            ['O que você recebeu?', [['Cobrança para pagar em poucos dias', 'cobranca'], ['Aviso de penhora ou bloqueio', 'penhora'], ['Aviso de leilão', 'leilao'], ['Não sei, recebi um papel do oficial', 'nao_sei']]],
            ['Quando você recebeu?', [['Hoje ou ontem', 'hoje'], ['Há menos de 15 dias', 'menos_15'], ['Há mais de 15 dias', 'mais_15'], ['Não lembro', 'nao_sei']]],
            ['Essa dívida é de quem?', [['Da minha empresa', 'empresa'], ['Minha, pessoal', 'pessoal'], ['Sou avalista ou fiador', 'avalista']]],
            ['Qual o valor que o banco está cobrando?', VALUE_OPTIONS],
            ['Você já tem advogado cuidando desse processo?', [['Não tenho', 'nao'], ['Tenho, mas quero outra opinião', 'segunda_opiniao'], ['Tenho', 'tem_advogado']]]
        ],
        result: 'Entendi. Quando o banco entra na Justiça, os prazos de defesa são curtos e começam a contar do recebimento. O seu caso vai para análise com prioridade.',
        docs: 'Foto do documento entregue pelo oficial e o contrato da dívida'
    },
    empresa: {
        label: 'Empresa endividada', type: 'empresa', icon: 'company', valueQuestion: 2,
        questions: [
            ['Qual dívida mais pesa hoje?', [['Pronampe ou FGI', 'pronampe'], ['Capital de giro', 'capital_giro'], ['Cheque especial', 'cheque'], ['Cartão da empresa', 'cartao'], ['Mais de uma', 'varias']]],
            ['Qual é a situação agora?', [['Em dia, mas sufocando o caixa', 'em_dia'], ['Parcelas atrasadas', 'atrasadas'], ['Já renegociei e não consigo pagar', 'renegociada'], ['Banco negativou ou protestou', 'protesto'], ['Acho os juros altos demais', 'juros']]],
            ['Somando tudo, quanto a empresa deve aos bancos?', VALUE_OPTIONS],
            ['O que foi dado em garantia?', [['Aval dos sócios', 'avalista'], ['Imóvel ou veículo', 'bem'], ['Recebíveis da empresa', 'recebiveis'], ['Só o fundo garantidor', 'fundo'], ['Não sei', 'nao_sei']]],
            ['A empresa continua funcionando?', [['Sim, faturando normalmente', 'normal'], ['Sim, mas faturando pouco', 'pouco'], ['Está parada', 'parada']]]
        ],
        result: 'Entendi. Dívidas bancárias de empresa costumam ter encargos e garantias que podem ser discutidos. Um advogado vai analisar os seus contratos antes de indicar o caminho.',
        docs: 'Contratos das dívidas e extratos dos últimos 3 meses'
    },
    bloqueio: {
        label: 'Conta bloqueada', type: 'empresa', icon: 'bank',
        questions: [
            ['Quem bloqueou a conta?', [['A Justiça, por causa de um processo', 'justica'], ['O próprio banco, sem explicar', 'banco'], ['Não sei', 'nao_sei']]],
            ['Quando foi o bloqueio?', [['Hoje ou ontem', 'hoje'], ['Nesta semana', 'semana'], ['Há mais de uma semana', 'mais_semana']]],
            ['Quanto ficou bloqueado?', [['Até R$ 20 mil', 'ate_20'], ['R$ 20 a 100 mil', '20_100'], ['R$ 100 a 500 mil', '100_500'], ['Acima de R$ 500 mil', 'acima_500'], ['Não sei', 'nao_sei']]],
            ['Esse dinheiro era para quê?', [['Folha de pagamento', 'folha'], ['Fornecedores e impostos', 'fornecedores'], ['Reserva da empresa', 'reserva'], ['Outro', 'outro']]],
            ['O bloqueio veio de uma dívida com banco?', [['Sim', 'sim'], ['Não, é de outra origem', 'fora_bancario'], ['Não sei', 'nao_sei']]]
        ],
        result: 'Entendi. Bloqueio de conta pode parar a empresa, e existem medidas para pedir a liberação conforme a origem do dinheiro. O seu caso vai para análise com prioridade.',
        docs: 'Extrato mostrando o bloqueio e o número do processo, se houver'
    },
    recebiveis: {
        label: 'Recebíveis retidos', type: 'empresa', icon: 'money', valueQuestion: 4,
        questions: [
            ['O que o banco está segurando?', [['Vendas da maquininha', 'maquininha'], ['Duplicatas ou boletos', 'duplicatas'], ['Aplicação ou saldo travado', 'saldo'], ['Não sei', 'nao_sei']]],
            ['Isso está ligado a qual dívida?', [['Capital de giro', 'capital_giro'], ['Antecipação de recebíveis', 'antecipacao'], ['Cheque especial ou conta garantida', 'cheque'], ['Não sei', 'nao_sei']]],
            ['Quanto do faturamento fica retido?', [['Menos de 30%', 'menos_30'], ['De 30% a 60%', '30_60'], ['Mais de 60%', 'mais_60'], ['Praticamente tudo', 'tudo']]],
            ['Como estão as parcelas dessa dívida?', [['Em dia', 'em_dia'], ['Atrasadas', 'atrasadas'], ['Já renegociei e não consigo pagar', 'renegociada']]],
            ['Qual o valor total da dívida?', VALUE_OPTIONS]
        ],
        result: 'Entendi. A retenção de recebíveis depende do que está escrito no contrato, e isso pode ser revisto. Um advogado vai analisar o seu contrato.',
        docs: 'Contrato da dívida e extrato da maquininha ou da conta vinculada'
    },
    avalista: {
        label: 'Sócio ou avalista', type: 'empresa_ou_pessoa', icon: 'person', valueQuestion: 2,
        questions: [
            ['Qual é a sua situação?', [['Sou avalista de dívida da empresa', 'avalista_empresa'], ['Sou sócio de empresa que deve', 'socio'], ['Saí da sociedade e ainda me cobram', 'ex_socio'], ['Fui avalista de outra pessoa', 'avalista_pessoa']]],
            ['O que já aconteceu com você?', [['Só cobranças do banco', 'cobranca'], ['Meu nome foi negativado', 'negativado'], ['Recebi um processo', 'processo'], ['Bloquearam conta ou bem meu', 'bloqueio']]],
            ['Qual o valor da dívida?', VALUE_OPTIONS],
            ['O que você teme perder?', [['O imóvel onde moro', 'moradia'], ['Outros imóveis', 'imoveis'], ['Veículos', 'veiculos'], ['Salário ou dinheiro em conta', 'dinheiro'], ['Não sei', 'nao_sei']]],
            ['A empresa ainda está ativa?', [['Sim', 'sim'], ['Está parada', 'parada'], ['Já foi encerrada', 'encerrada']]]
        ],
        result: 'Entendi. A responsabilidade de sócios e avalistas tem limites que dependem do que foi assinado. Um advogado vai analisar os documentos do seu caso.',
        docs: 'Contrato com a sua assinatura e o contrato social da empresa'
    },
    imovel: {
        label: 'Imóvel em atraso', type: 'pessoa', icon: 'home', valueQuestion: 4,
        questions: [
            ['Quantas parcelas estão em atraso?', [['1 ou 2', '1_2'], ['3 ou mais', '3_mais'], ['Perdi a conta', 'nao_sei']]],
            ['Você já recebeu algum aviso?', [['Nenhum', 'nenhum'], ['Cobrança do banco', 'cobranca'], ['Notificação do cartório', 'cartorio'], ['Aviso de leilão', 'leilao'], ['O imóvel já foi a leilão', 'ja_leilao']]],
            ['Com quem é o financiamento?', [['Caixa', 'caixa'], ['Outro banco', 'banco'], ['Construtora ou incorporadora', 'construtora']]],
            ['Esse imóvel é:', [['Onde eu moro', 'moradia'], ['Um investimento', 'investimento'], ['Comercial', 'comercial']]],
            ['Quanto falta pagar do financiamento?', VALUE_OPTIONS]
        ],
        result: 'Entendi. No financiamento de imóvel existem etapas e prazos antes do leilão, e o momento em que você está muda o que pode ser feito. O seu caso vai para análise.',
        docs: 'Contrato do financiamento e qualquer notificação recebida'
    },
    servidor: {
        label: 'Servidor de carreira', type: 'pessoa', icon: 'service',
        questions: [
            ['Qual é o seu vínculo?', [['Federal', 'federal'], ['Estadual', 'estadual'], ['Municipal', 'municipal'], ['Militar', 'militar'], ['Aposentado ou pensionista', 'aposentado']]],
            ['Qual é a sua renda bruta mensal, mais ou menos?', [['Até R$ 10 mil', 'ate_10'], ['R$ 10 a 20 mil', '10_20'], ['R$ 20 a 30 mil', '20_30'], ['Acima de R$ 30 mil', 'acima_30']]],
            ['Que tipo de dívida mais pesa?', [['Consignado em folha', 'consignado'], ['Empréstimo debitado na conta', 'conta'], ['Cartão consignado', 'cartao_consignado'], ['Cartão e cheque especial', 'cartao_cheque'], ['Várias ao mesmo tempo', 'varias']]],
            ['Há quanto tempo você está no serviço público?', [['Menos de 5 anos', 'menos_5'], ['De 5 a 10 anos', '5_10'], ['Mais de 10 anos', 'mais_10']]],
            ['Há quanto tempo você tem empréstimos e vem renovando ou refinanciando?', [['Há menos de 5 anos', 'menos_5'], ['De 5 a 10 anos', '5_10'], ['Há mais de 10 anos', 'mais_10']]]
        ],
        result: 'Entendi. Renovações sucessivas de empréstimo ao longo de anos podem ser questionadas na Justiça, conforme o que foi contratado em cada operação. A análise do seu caso é individual, sigilosa e feita diretamente por um advogado.',
        docs: 'Contracheque mais recente e lista das dívidas'
    },
    golpe: {
        label: 'Golpe falsa central', type: 'pessoa', icon: 'phone', valueQuestion: 1,
        questions: [
            ['Como aconteceu?', [['Ligaram como se fossem do banco e fiz um PIX', 'pix'], ['Pediram para instalar um aplicativo', 'aplicativo'], ['Fizeram empréstimo no meu nome na ligação', 'emprestimo'], ['Foi outro tipo de golpe', 'fora_escopo']]],
            ['Qual foi o prejuízo?', [['Até R$ 30 mil', 'ate_30'], ['R$ 30 a 50 mil', '30_50'], ['R$ 50 a 100 mil', '50_100'], ['Acima de R$ 100 mil', 'acima_100']]],
            ['Quando aconteceu?', [['Nos últimos dias', 'ultimos_dias'], ['No último mês', 'ultimo_mes'], ['De 1 a 3 meses atrás', '1_3_meses'], ['Há mais de 3 meses', 'mais_3_meses']]],
            ['O que você já fez?', [['Boletim de ocorrência e reclamação no banco', 'ambos'], ['Só uma das duas coisas', 'uma'], ['Ainda nada', 'nada']]],
            ['O que o banco respondeu?', [['Negou a devolução', 'negou'], ['Ainda não respondeu', 'sem_resposta'], ['Devolveu uma parte', 'parcial'], ['Devolveu tudo', 'total']]]
        ],
        result: 'Entendi. Nesses casos a Justiça avalia se houve falha de segurança do banco, caso a caso. Um advogado vai analisar o que aconteceu.',
        docs: 'Boletim de ocorrência, comprovante do PIX e resposta do banco'
    },
    exterior: {
        label: 'Dívidas no exterior', type: 'pessoa', icon: 'globe',
        questions: [
            ['Qual é a situação ligada ao Brasil?', [['Preciso enviar dinheiro para a família', 'remessa'], ['Quero comprar algo no Brasil', 'compra'], ['Uma conta ou valor foi bloqueado', 'bloqueio'], ['Outro caso', 'outro']]],
            ['O problema envolve dívida bancária?', [['Sim', 'sim'], ['Não', 'nao'], ['Não sei', 'nao_sei']]]
        ],
        result: 'Entendi. Vou encaminhar a sua situação ligada ao Brasil para análise.',
        docs: 'Documentos da dívida, da remessa ou do patrimônio ligado ao Brasil'
    },
    outro: {
        label: 'Meu caso é outro', type: 'indefinido', icon: 'other',
        questions: [
            ['O problema é com:', [['Dívida da empresa', 'empresa'], ['Dívida pessoal', 'pessoal'], ['Outro assunto com banco', 'outro']]],
            ['Existe processo, bloqueio ou prazo correndo?', [['Sim', 'sim'], ['Não', 'nao'], ['Não sei', 'nao_sei']]],
            ['Conte em uma ou duas frases o que está acontecendo.', []]
        ],
        result: 'Entendi. Vou encaminhar o seu relato para análise.',
        docs: 'Contratos, extratos, notificações e comprovantes relacionados ao caso'
    }
};

const AUTHORITY_POINTS = {
    processo: ['Prazos judiciais podem estar em andamento', 'O documento recebido define a fase do processo', 'Contrato e garantias precisam ser analisados em conjunto'],
    bloqueio: ['A origem do bloqueio muda a medida possível', 'Verbas operacionais podem exigir atenção imediata', 'Extrato e número do processo ajudam a definir o caminho'],
    recebiveis: ['A retenção depende do que foi pactuado no contrato', 'O percentual retido revela o impacto sobre o caixa', 'Extratos e instrumentos da dívida precisam ser confrontados'],
    empresa: ['Contratos bancários e garantias devem ser analisados', 'O impacto da dívida sobre o caixa orienta a estratégia', 'A situação da empresa define a prioridade do atendimento'],
    avalista: ['A responsabilidade depende do que foi assinado', 'Processo ou bloqueio aumentam a urgência da análise', 'Contrato e quadro societário precisam ser conferidos'],
    imovel: ['A etapa da cobrança altera as medidas disponíveis', 'Notificação de cartório ou leilão exige atenção', 'Contrato e avisos recebidos precisam ser avaliados juntos'],
    servidor: ['Tempo de vínculo e refinanciamentos são relevantes', 'Contracheque e histórico das dívidas orientam a análise', 'Cada operação precisa ser avaliada individualmente'],
    golpe: ['Data, dinâmica do golpe e resposta do banco importam', 'Boletim, comprovantes e contestação fortalecem a análise', 'A responsabilidade do banco é avaliada caso a caso'],
    outro: ['O relato será encaminhado para leitura individual', 'Processo, bloqueio ou prazo definem a prioridade', 'Documentos disponíveis ajudam a compreender a situação'],
    exterior: ['O vínculo da dívida com o Brasil precisa ser identificado', 'Bloqueios e patrimônio exigem análise do contexto', 'Documentos da dívida ou remessa ajudam a orientar o caso']
};

const TRIAGE_PERCENTAGES = Object.freeze({
    processo: 89.2,
    bloqueio: 88.6,
    imovel: 87.1,
    recebiveis: 86.4,
    golpe: 85.6,
    empresa: 84.7,
    avalista: 82.8,
    servidor: 81.9,
    exterior: 79.8,
    outro: 79.1
});

function getTriagePercentage(branch, urgent = false) {
    const base = TRIAGE_PERCENTAGES[branch] || 79.1;
    return Number(Math.min(89.9, base + (urgent ? 0.7 : 0)).toFixed(1));
}

function formatPercentage(value) {
    return `${Number(value).toFixed(1).replace('.', ',')}%`;
}

function animatePercentage(element, target, duration = 1300) {
    if (!element) return;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof requestAnimationFrame !== 'function') {
        element.textContent = formatPercentage(target);
        return;
    }

    const animationDuration = reduceMotion ? Math.min(duration, 850) : duration;
    const startedAt = performance.now();
    const tick = now => {
        const progress = Math.min(1, (now - startedAt) / animationDuration);
        const eased = 1 - Math.pow(1 - progress, 4);
        element.textContent = formatPercentage(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function getAuthorityContent(branch, urgent) {
    return {
        tone: urgent ? 'urgent' : 'analysis',
        title: urgent ? 'Seu caso pede atenção rápida' : 'Pontos que merecem análise especializada',
        points: AUTHORITY_POINTS[branch] || AUTHORITY_POINTS.outro
    };
}

function buildLeadWhatsapp(rawNumber, rawDdi = '+55', branch = 'empresa') {
    let number = String(rawNumber || '').replace(/\D/g, '');
    const country = branch === 'exterior' ? (String(rawDdi || '').replace(/\D/g, '').slice(0, 4) || '55') : '55';
    const hasCountryInNumber = String(rawNumber || '').trim().startsWith('+') || number.length > 11;
    if (hasCountryInNumber && number.startsWith(country)) number = number.slice(country.length);
    if (branch === 'exterior') number = number.replace(/^0+/, '');
    return country + number;
}

function getDismissalContent(reason) {
    const messages = {
        valor_baixo: {
            title: 'Neste momento, este caso não seguirá para atendimento',
            lead: 'Preferimos oferecer uma orientação clara, sem criar uma expectativa que talvez não se confirme.',
            guidance: 'Você pode buscar uma solução pelo consumidor.gov.br, pelo Procon da sua cidade ou estado e pela ouvidoria do banco. Se surgirem outros detalhes, como desconto não autorizado, processo, bloqueio ou prazo, refaça a análise.'
        },
        golpe_fora_escopo: {
            title: 'Esta situação não faz parte da atuação atual do escritório',
            lead: 'Preferimos ser claros para que você possa procurar o caminho mais adequado.',
            guidance: 'Registre o boletim de ocorrência, conteste a operação no seu banco e, se não resolver, procure o consumidor.gov.br, o Banco Central ou o Procon.'
        },
        prejuizo_devolvido: {
            title: 'A situação informada não exige uma nova medida neste momento',
            lead: 'Como o banco devolveu integralmente o valor, não há prejuízo pendente a recuperar.',
            guidance: 'Se perceber que ficou faltando alguma parte ou surgirem novos fatos, refaça a análise com as informações atualizadas.'
        },
        ja_tem_advogado: {
            title: 'O acompanhamento deve continuar com o advogado do processo',
            lead: 'Ele já conhece os documentos e os prazos do seu caso.',
            guidance: 'Converse diretamente com o profissional responsável. Se no futuro precisar de uma nova análise em Direito Bancário, você poderá refazer esta triagem.'
        }
    };
    return messages[reason] || messages.valor_baixo;
}

const state = {
    sessionId: getSessionId(), branch: null, questionIndex: 0, answers: [], tags: [], urgent: false,
    personType: null, valueCode: null, valueLabel: null, outcome: null, transitionTimer: null,
    analysisTimer: null, analysisStatusTimer: null
};

document.addEventListener('DOMContentLoaded', () => {
    const profile = document.querySelector('.profile-switch');
    if (profile) profile.style.display = 'none';
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
    state.urgent = false;
    state.personType = FLOW[normalized].type;
    state.valueCode = null;
    state.valueLabel = null;
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

function escapeJs(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function answerQuestion(label, value) {
    const branch = FLOW[state.branch];
    state.answers.push({ question: branch.questions[state.questionIndex][0], answer: label, value });
    applyRules(state.branch, state.questionIndex, value, label);
    state.questionIndex += 1;
    if (state.questionIndex < branch.questions.length) {
        renderQuestion();
        updateProgress();
        return;
    }
    finishBranch();
}

function submitFreeText() {
    const field = document.getElementById('freeCase');
    const value = field ? field.value.trim() : '';
    if (!value) { if (field) field.focus(); return; }
    answerQuestion(value, 'texto_livre');
}

function applyRules(branch, index, value, label) {
    if (FLOW[branch].valueQuestion === index) {
        state.valueCode = value;
        state.valueLabel = label;
    }
    if (branch === 'processo') {
        if (index === 1 && ['hoje', 'menos_15'].includes(value)) state.urgent = true;
        if (index === 2) state.personType = value === 'empresa' ? 'empresa' : 'pessoa_fisica';
        if (index === 4 && value === 'tem_advogado') state.outcome = 'ja_tem_advogado';
    }
    if (branch === 'bloqueio') {
        if (index === 0 && value === 'justica') state.urgent = true;
        if (index === 2) { state.valueCode = value; state.valueLabel = label; }
        if (index === 4 && value === 'fora_bancario') state.tags.push('fora_do_bancario');
    }
    if (branch === 'recebiveis' && index === 2 && ['mais_60', 'tudo'].includes(value)) state.urgent = true;
    if (branch === 'empresa' && index === 3 && ['recebiveis', 'avalista'].includes(value)) state.tags.push(value);
    if (branch === 'avalista' && index === 1 && ['processo', 'bloqueio'].includes(value)) state.urgent = true;
    if (branch === 'imovel' && index === 1 && ['cartorio', 'leilao', 'ja_leilao'].includes(value)) state.urgent = true;
    if (branch === 'servidor') {
        if (index === 1) state.serverIncome = value;
        if (index === 3) state.serverTime = value;
        if (index === 4) state.loanTime = value;
    }
    if (branch === 'golpe') {
        if (index === 0 && value === 'fora_escopo') state.outcome = 'golpe_fora_escopo';
        if (index === 1) { state.valueCode = value; state.valueLabel = label; if (value === 'ate_30') state.outcome = 'valor_baixo'; }
        if (index === 2 && value === 'ultimos_dias') state.urgent = true;
        if (index === 4 && value === 'total') state.outcome = 'prejuizo_devolvido';
    }
    if (branch === 'outro' && index === 0) state.personType = value === 'empresa' ? 'empresa' : value === 'pessoal' ? 'pessoa_fisica' : 'indefinido';
    if (branch === 'outro' && index === 1 && value === 'sim') state.urgent = true;
}

function finishBranch() {
    if (state.branch === 'servidor') {
        const incomeOk = ['10_20', '20_30', 'acima_30'].includes(state.serverIncome);
        const serviceOk = state.serverTime === 'mais_10';
        const loansOk = ['5_10', 'mais_10'].includes(state.loanTime);
        state.tags.push(incomeOk && serviceOk && loansOk ? 'servidor_nulidade' : 'servidor_fora_do_perfil');
    }
    if (!state.outcome && ['processo', 'recebiveis', 'empresa', 'avalista', 'imovel'].includes(state.branch)) {
        if (['ate_50', '50_100'].includes(state.valueCode)) state.outcome = 'oferta_laudo';
        if (['100_300', '300_500', 'nao_sei'].includes(state.valueCode)) state.tags.push('revisar');
        if (state.valueCode === 'acima_500') state.tags.push('prioridade_maxima');
    }
    if (!state.outcome) state.outcome = 'qualificado';
    if (state.urgent) state.tags.push('urgente');
    showAnalysis();
}

function showAnalysis() {
    const progress = document.getElementById('progressBar');
    if (progress) progress.style.width = '100%';
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
    if (state.outcome === 'oferta_laudo') return showLaudoOffer();
    if (['golpe_fora_escopo', 'valor_baixo', 'prejuizo_devolvido', 'ja_tem_advogado'].includes(state.outcome)) return showDismissal(state.outcome);
    showQualifiedResult();
}

function showLaudoOffer() {
    const title = document.getElementById('disqTitle');
    const lead = document.getElementById('disqLead');
    const content = document.getElementById('disqContent');
    const badge = document.getElementById('disqBadge');
    if (badge) badge.textContent = 'Opção de análise';
    title.textContent = 'Análise do contrato antes de uma ação';
    lead.textContent = 'Obrigada por contar a sua situação. Pelo valor da dívida, uma ação judicial tende a custar mais do que o resultado.';
    content.innerHTML = '<p>Para casos assim, o escritório oferece um laudo de análise do contrato. Ele mostra se há cobranças indevidas e serve de base para você negociar com o banco.</p><p><strong>Quer saber como funciona?</strong></p><div class="disq-actions"><button class="btn-restart" type="button" onclick="acceptLaudo()">Quero saber</button><button class="btn-text" type="button" onclick="declineLaudo()">Agora não</button></div>';
    document.getElementById('progressWrap').style.display = 'none';
    transitionToStep(document.getElementById('disqualifiedStep'));
}

function acceptLaudo() {
    state.tags.push(state.valueCode === '50_100' ? 'laudo_fechar' : 'laudo');
    state.outcome = 'qualificado_laudo';
    showQualifiedResult(true);
}

function declineLaudo() {
    showDismissal('valor_baixo');
}

function showDismissal(reason) {
    const message = getDismissalContent(reason);
    const badge = document.getElementById('disqBadge');
    if (badge) badge.textContent = 'Resposta franca';
    document.getElementById('disqTitle').textContent = message.title;
    document.getElementById('disqLead').textContent = message.lead;
    document.getElementById('disqContent').innerHTML = `<strong>Nossa orientação para este caso</strong><p>${message.guidance}</p>`;
    document.getElementById('progressWrap').style.display = 'none';
    transitionToStep(document.getElementById('disqualifiedStep'));
}

function showQualifiedResult(isLaudo = false) {
    const branch = FLOW[state.branch];
    const title = document.getElementById('successTitle');
    const lead = document.getElementById('successLead');
    const hint = document.getElementById('documentsHint');
    const result = isLaudo ? 'Para saber como funciona o laudo, deixe seus dados para o atendimento.' : branch.result;
    title.textContent = isLaudo ? 'Laudo de análise do contrato' : 'Análise concluída.';
    lead.textContent = isLaudo ? result : result.replace(/^Entendi\.\s*/, '');
    hint.textContent = `Para adiantar a análise, separe se puder: ${branch.docs}.`;
    const authority = getAuthorityContent(state.branch, state.urgent);
    const authorityCard = document.getElementById('authorityCard');
    const authorityTitle = document.getElementById('authorityTitle');
    const authorityPoints = document.getElementById('authorityPoints');
    if (authorityCard) authorityCard.dataset.tone = authority.tone;
    if (authorityTitle) authorityTitle.textContent = authority.title;
    if (authorityPoints) authorityPoints.innerHTML = authority.points.map(point => `<li>${point}</li>`).join('');
    const percentage = document.getElementById('triagePercentage');
    const percentageValue = getTriagePercentage(state.branch, state.urgent);
    if (percentage) {
        percentage.textContent = '0,0%';
        percentage.setAttribute('aria-label', `${formatPercentage(percentageValue)} de aderência à análise especializada`);
        setTimeout(() => animatePercentage(percentage, percentageValue), 260);
    }
    const ddiControl = document.getElementById('ddiControl');
    const ddiInput = document.getElementById('ddi');
    if (ddiControl) ddiControl.hidden = state.branch !== 'exterior';
    if (ddiInput) ddiInput.value = '+55';
    document.getElementById('laudoBox').style.display = isLaudo ? 'block' : 'none';
    document.getElementById('progressWrap').style.display = 'block';
    document.getElementById('progressBar').style.width = '100%';
    transitionToStep(document.getElementById('step4'));
}

function updateProgress() {
    const total = FLOW[state.branch].questions.length + 1;
    const current = state.questionIndex + 1;
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = `${Math.round((current / total) * 100)}%`;
}

function transitionToStep(target) {
    if (!target) return;
    const current = document.querySelector('.quiz-step.active');
    clearTimeout(state.transitionTimer);
    if (current === target) { sendAutoHeight(); return; }
    if (current) { current.classList.remove('active'); current.classList.add('is-leaving'); }
    document.querySelectorAll('.quiz-step').forEach(step => {
        if (step !== current && step !== target) step.classList.remove('active', 'is-leaving');
    });
    state.transitionTimer = setTimeout(() => {
        if (current) current.classList.remove('is-leaving');
        target.classList.add('active');
        sendAutoHeight();
        const focus = target.querySelector('button, input, textarea');
        if (focus) focus.focus({ preventScroll: true });
    }, 220);
}

function goToStep(step) {
    if (step === 1) restartQuiz();
}

function restartQuiz() {
    clearTimeout(state.analysisTimer);
    clearInterval(state.analysisStatusTimer);
    Object.assign(state, { branch: null, questionIndex: 0, answers: [], tags: [], urgent: false, personType: null, valueCode: null, valueLabel: null, outcome: null, serverIncome: null, serverTime: null, loanTime: null });
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

async function handleLeadSubmit(event) {
    event.preventDefault();
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
    const whatsapp = buildLeadWhatsapp(rawWhatsapp, ddi, state.branch);
    const params = new URLSearchParams(location.search);
    const payload = {
        event_type: 'lead_submission', sessionId: state.sessionId, ramo: state.branch,
        etiquetas: [...new Set(state.tags)], urgente: state.urgent, pessoa_fisica_ou_empresa: state.personType,
        faixa_valor: state.valueLabel || 'Não informado', respostas: state.answers,
        nome, whatsapp, ddi: state.branch === 'exterior' ? ddi : '+55', cidade, estado, melhor_horario: horario, consentimento_lgpd: true,
        origem: params.get('utm_source') || params.get('source') || document.referrer || 'site',
        campanha: params.get('utm_campaign') || '', palavra_chave: params.get('keyword') || '',
        timestamp: new Date().toISOString()
    };
    const button = document.getElementById('btnSubmit');
    button.disabled = true;
    button.querySelector('span').textContent = 'Encaminhando seus dados...';
    try { await fetch(N8N_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch (error) { console.warn('Falha ao enviar o lead:', error); }
    const urgentLine = state.urgent ? 'Como o seu caso tem prazo, ele entrou na fila de prioridade.' : 'Recebi as suas respostas e já encaminhei o seu caso.';
    const message = encodeURIComponent(`Olá, Dra. Ana Magalhães! Concluí a triagem.\n\nNome: ${nome}\nRamo: ${FLOW[state.branch].label}\nUrgente: ${state.urgent ? 'Sim' : 'Não'}\nValor: ${state.valueLabel || 'Não informado'}\nCidade/UF: ${cidade}/${estado}\nMelhor horário: ${horario}\n\n${urgentLine}\nDocumentos: ${FLOW[state.branch].docs}.`);
    window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

function sendAutoHeight() {
    const container = document.getElementById('quizContainer');
    if (container) window.parent.postMessage({ quizHeight: container.offsetHeight + 40, rbQuizHeight: container.offsetHeight + 40 }, '*');
}

function sendAnalyticsEvent(step) {
    const payload = { event_type: 'analytics', sessionId: state.sessionId, step, ramo: state.branch || 'inicio', timestamp: new Date().toISOString() };
    try {
        if (navigator.sendBeacon) navigator.sendBeacon(N8N_WEBHOOK_URL, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    } catch (_) { /* telemetria não interrompe o fluxo */ }
}
