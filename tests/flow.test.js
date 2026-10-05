const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'quiz-flow.js'), 'utf8');

function loadFlow() {
    const storage = new Map();
    const animationFrames = [];
    const element = () => ({
        style: {},
        classList: { add() {}, remove() {} },
        querySelector() { return null; },
        focus() {},
        offsetHeight: 600,
        textContent: ''
    });
    const elements = new Map();
    const sandbox = {
        console,
        Blob,
        URLSearchParams,
        setTimeout: () => 0,
        clearTimeout() {},
        setInterval: () => 0,
        clearInterval() {},
        performance: { now: () => 0 },
        requestAnimationFrame: callback => {
            animationFrames.push(callback);
            return animationFrames.length;
        },
        sessionStorage: {
            getItem: key => storage.get(key) || null,
            setItem: (key, value) => storage.set(key, value)
        },
        document: {
            addEventListener() {},
            getElementById(id) {
                if (!elements.has(id)) elements.set(id, element());
                return elements.get(id);
            },
            querySelector() { return null; },
            querySelectorAll() { return []; }
        },
        navigator: {},
        location: { search: '' },
        window: {
            matchMedia: () => ({ matches: true })
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(`${source}\n;globalThis.__quiz = {
        FLOW, state, applyRules, finishBranch,
        buildLeadWhatsapp: typeof buildLeadWhatsapp === 'function' ? buildLeadWhatsapp : undefined,
        getAuthorityContent: typeof getAuthorityContent === 'function' ? getAuthorityContent : undefined,
        getTriagePercentage: typeof getTriagePercentage === 'function' ? getTriagePercentage : undefined,
        animatePercentage: typeof animatePercentage === 'function' ? animatePercentage : undefined,
        getDismissalContent: typeof getDismissalContent === 'function' ? getDismissalContent : undefined
    };`, sandbox);
    sandbox.__quiz.animationFrames = animationFrames;
    return sandbox.__quiz;
}

const { FLOW, state, applyRules, finishBranch, buildLeadWhatsapp, getAuthorityContent, getTriagePercentage, animatePercentage, animationFrames, getDismissalContent } = loadFlow();

const documented = {
    processo: [
        ['O que você recebeu?', ['Cobrança para pagar em poucos dias', 'Aviso de penhora ou bloqueio', 'Aviso de leilão', 'Não sei, recebi um papel do oficial']],
        ['Quando você recebeu?', ['Hoje ou ontem', 'Há menos de 15 dias', 'Há mais de 15 dias', 'Não lembro']],
        ['Essa dívida é de quem?', ['Da minha empresa', 'Minha, pessoal', 'Sou avalista ou fiador']],
        ['Qual o valor que o banco está cobrando?', ['Até R$ 50 mil', 'R$ 50 a 100 mil', 'R$ 100 a 300 mil', 'R$ 300 a 500 mil', 'Acima de R$ 500 mil', 'Não sei']],
        ['Você já tem advogado cuidando desse processo?', ['Não tenho', 'Tenho, mas quero outra opinião', 'Tenho']]
    ],
    bloqueio: [
        ['Quem bloqueou a conta?', ['A Justiça, por causa de um processo', 'O próprio banco, sem explicar', 'Não sei']],
        ['Quando foi o bloqueio?', ['Hoje ou ontem', 'Nesta semana', 'Há mais de uma semana']],
        ['Quanto ficou bloqueado?', ['Até R$ 20 mil', 'R$ 20 a 100 mil', 'R$ 100 a 500 mil', 'Acima de R$ 500 mil', 'Não sei']],
        ['Esse dinheiro era para quê?', ['Folha de pagamento', 'Fornecedores e impostos', 'Reserva da empresa', 'Outro']],
        ['O bloqueio veio de uma dívida com banco?', ['Sim', 'Não, é de outra origem', 'Não sei']]
    ],
    recebiveis: [
        ['O que o banco está segurando?', ['Vendas da maquininha', 'Duplicatas ou boletos', 'Aplicação ou saldo travado', 'Não sei']],
        ['Isso está ligado a qual dívida?', ['Capital de giro', 'Antecipação de recebíveis', 'Cheque especial ou conta garantida', 'Não sei']],
        ['Quanto do faturamento fica retido?', ['Menos de 30%', 'De 30% a 60%', 'Mais de 60%', 'Praticamente tudo']],
        ['Como estão as parcelas dessa dívida?', ['Em dia', 'Atrasadas', 'Já renegociei e não consigo pagar']],
        ['Qual o valor total da dívida?', ['Até R$ 50 mil', 'R$ 50 a 100 mil', 'R$ 100 a 300 mil', 'R$ 300 a 500 mil', 'Acima de R$ 500 mil', 'Não sei']]
    ],
    empresa: [
        ['Qual dívida mais pesa hoje?', ['Pronampe ou FGI', 'Capital de giro', 'Cheque especial', 'Cartão da empresa', 'Mais de uma']],
        ['Qual é a situação agora?', ['Em dia, mas sufocando o caixa', 'Parcelas atrasadas', 'Já renegociei e não consigo pagar', 'Banco negativou ou protestou', 'Acho os juros altos demais']],
        ['Somando tudo, quanto a empresa deve aos bancos?', ['Até R$ 50 mil', 'R$ 50 a 100 mil', 'R$ 100 a 300 mil', 'R$ 300 a 500 mil', 'Acima de R$ 500 mil', 'Não sei']],
        ['O que foi dado em garantia?', ['Aval dos sócios', 'Imóvel ou veículo', 'Recebíveis da empresa', 'Só o fundo garantidor', 'Não sei']],
        ['A empresa continua funcionando?', ['Sim, faturando normalmente', 'Sim, mas faturando pouco', 'Está parada']]
    ],
    avalista: [
        ['Qual é a sua situação?', ['Sou avalista de dívida da empresa', 'Sou sócio de empresa que deve', 'Saí da sociedade e ainda me cobram', 'Fui avalista de outra pessoa']],
        ['O que já aconteceu com você?', ['Só cobranças do banco', 'Meu nome foi negativado', 'Recebi um processo', 'Bloquearam conta ou bem meu']],
        ['Qual o valor da dívida?', ['Até R$ 50 mil', 'R$ 50 a 100 mil', 'R$ 100 a 300 mil', 'R$ 300 a 500 mil', 'Acima de R$ 500 mil', 'Não sei']],
        ['O que você teme perder?', ['O imóvel onde moro', 'Outros imóveis', 'Veículos', 'Salário ou dinheiro em conta', 'Não sei']],
        ['A empresa ainda está ativa?', ['Sim', 'Está parada', 'Já foi encerrada']]
    ],
    imovel: [
        ['Quantas parcelas estão em atraso?', ['1 ou 2', '3 ou mais', 'Perdi a conta']],
        ['Você já recebeu algum aviso?', ['Nenhum', 'Cobrança do banco', 'Notificação do cartório', 'Aviso de leilão', 'O imóvel já foi a leilão']],
        ['Com quem é o financiamento?', ['Caixa', 'Outro banco', 'Construtora ou incorporadora']],
        ['Esse imóvel é:', ['Onde eu moro', 'Um investimento', 'Comercial']],
        ['Quanto falta pagar do financiamento?', ['Até R$ 50 mil', 'R$ 50 a 100 mil', 'R$ 100 a 300 mil', 'R$ 300 a 500 mil', 'Acima de R$ 500 mil', 'Não sei']]
    ],
    servidor: [
        ['Qual é o seu vínculo?', ['Federal', 'Estadual', 'Municipal', 'Militar', 'Aposentado ou pensionista']],
        ['Qual é a sua renda bruta mensal, mais ou menos?', ['Até R$ 10 mil', 'R$ 10 a 20 mil', 'R$ 20 a 30 mil', 'Acima de R$ 30 mil']],
        ['Que tipo de dívida mais pesa?', ['Consignado em folha', 'Empréstimo debitado na conta', 'Cartão consignado', 'Cartão e cheque especial', 'Várias ao mesmo tempo']],
        ['Há quanto tempo você está no serviço público?', ['Menos de 5 anos', 'De 5 a 10 anos', 'Mais de 10 anos']],
        ['Há quanto tempo você tem empréstimos e vem renovando ou refinanciando?', ['Há menos de 5 anos', 'De 5 a 10 anos', 'Há mais de 10 anos']]
    ],
    golpe: [
        ['Como aconteceu?', ['Ligaram como se fossem do banco e fiz um PIX', 'Pediram para instalar um aplicativo', 'Fizeram empréstimo no meu nome na ligação', 'Foi outro tipo de golpe']],
        ['Qual foi o prejuízo?', ['Até R$ 30 mil', 'R$ 30 a 50 mil', 'R$ 50 a 100 mil', 'Acima de R$ 100 mil']],
        ['Quando aconteceu?', ['Nos últimos dias', 'No último mês', 'De 1 a 3 meses atrás', 'Há mais de 3 meses']],
        ['O que você já fez?', ['Boletim de ocorrência e reclamação no banco', 'Só uma das duas coisas', 'Ainda nada']],
        ['O que o banco respondeu?', ['Negou a devolução', 'Ainda não respondeu', 'Devolveu uma parte', 'Devolveu tudo']]
    ],
    outro: [
        ['O problema é com:', ['Dívida da empresa', 'Dívida pessoal', 'Outro assunto com banco']],
        ['Existe processo, bloqueio ou prazo correndo?', ['Sim', 'Não', 'Não sei']],
        ['Conte em uma ou duas frases o que está acontecendo.', []]
    ]
};

test('as nove ramificações reproduzem perguntas e respostas do documento', () => {
    for (const [branch, expectedQuestions] of Object.entries(documented)) {
        const actual = JSON.parse(JSON.stringify(FLOW[branch].questions.map(([question, options]) => [question, options.map(([label]) => label)])));
        assert.deepEqual(actual, expectedQuestions, branch);
    }
});

test('as devolutivas dos nove ramos são as documentadas', () => {
    const expected = {
        processo: 'Entendi. Quando o banco entra na Justiça, os prazos de defesa são curtos e começam a contar do recebimento. O seu caso vai para análise com prioridade.',
        bloqueio: 'Entendi. Bloqueio de conta pode parar a empresa, e existem medidas para pedir a liberação conforme a origem do dinheiro. O seu caso vai para análise com prioridade.',
        recebiveis: 'Entendi. A retenção de recebíveis depende do que está escrito no contrato, e isso pode ser revisto. Um advogado vai analisar o seu contrato.',
        empresa: 'Entendi. Dívidas bancárias de empresa costumam ter encargos e garantias que podem ser discutidos. Um advogado vai analisar os seus contratos antes de indicar o caminho.',
        avalista: 'Entendi. A responsabilidade de sócios e avalistas tem limites que dependem do que foi assinado. Um advogado vai analisar os documentos do seu caso.',
        imovel: 'Entendi. No financiamento de imóvel existem etapas e prazos antes do leilão, e o momento em que você está muda o que pode ser feito. O seu caso vai para análise.',
        servidor: 'Entendi. Renovações sucessivas de empréstimo ao longo de anos podem ser questionadas na Justiça, conforme o que foi contratado em cada operação. A análise do seu caso é individual, sigilosa e feita diretamente por um advogado.',
        golpe: 'Entendi. Nesses casos a Justiça avalia se houve falha de segurança do banco, caso a caso. Um advogado vai analisar o que aconteceu.',
        outro: 'Entendi. Vou encaminhar o seu relato para análise.'
    };
    for (const [branch, message] of Object.entries(expected)) assert.equal(FLOW[branch].result, message, branch);
});

test('a tela inicial preserva a ordem documentada e acrescenta exterior ao final', () => {
    const codes = [...html.matchAll(/handleOptionSelect\(1,\s*'[^']+',\s*'([^']+)'\)/g)].map(match => match[1]);
    assert.deepEqual(codes, ['processo', 'empresa', 'bloqueio', 'recebiveis', 'avalista', 'imovel', 'servidor', 'golpe', 'outro', 'exterior']);
    assert.match(html, /<script src="quiz-flow\.js"><\/script>/);
    assert.doesNotMatch(html, /script\.js/);
});

test('não exibe contagem de perguntas nem itens removidos', () => {
    const active = html + source;
    assert.doesNotMatch(active, /Pergunta \$\{|Pergunta \d+ de \d+/);
    const removedTerms = ['Rosen' + 'baum', 'Super' + 'endividamento', 'Busca e ' + 'Apreensão'];
    for (const term of removedTerms) assert.equal(active.toLowerCase().includes(term.toLowerCase()), false);
});

test('bloqueio só fica urgente pela origem judicial', () => {
    state.urgent = false;
    applyRules('bloqueio', 1, 'hoje', 'Hoje ou ontem');
    assert.equal(state.urgent, false);
    applyRules('bloqueio', 0, 'justica', 'A Justiça, por causa de um processo');
    assert.equal(state.urgent, true);
});

test('faixas de valor e exceções seguem a matriz de qualificação', () => {
    state.tags = [];
    state.valueCode = null;
    applyRules('empresa', 2, '100_300', 'R$ 100 a 300 mil');
    assert.equal(state.valueCode, '100_300');
    applyRules('empresa', 3, 'recebiveis', 'Recebíveis da empresa');
    assert.deepEqual(Array.from(state.tags), ['recebiveis']);

    state.outcome = null;
    applyRules('golpe', 1, 'ate_30', 'Até R$ 30 mil');
    assert.equal(state.outcome, 'valor_baixo');
});

test('classificação final aplica laudo, revisão e prioridade máxima', () => {
    Object.assign(state, { branch: 'empresa', valueCode: 'ate_50', outcome: null, tags: [], urgent: false });
    finishBranch();
    assert.equal(state.outcome, 'oferta_laudo');

    Object.assign(state, { branch: 'empresa', valueCode: '100_300', outcome: null, tags: [], urgent: false });
    finishBranch();
    assert.equal(state.outcome, 'qualificado');
    assert.deepEqual(Array.from(state.tags), ['revisar']);

    Object.assign(state, { branch: 'empresa', valueCode: 'acima_500', outcome: null, tags: [], urgent: false });
    finishBranch();
    assert.deepEqual(Array.from(state.tags), ['prioridade_maxima']);
});

test('servidor recebe a etiqueta documentada conforme os três critérios', () => {
    Object.assign(state, { branch: 'servidor', outcome: null, tags: [], urgent: false, serverIncome: '10_20', serverTime: 'mais_10', loanTime: '5_10' });
    finishBranch();
    assert.deepEqual(Array.from(state.tags), ['servidor_nulidade']);

    Object.assign(state, { branch: 'servidor', outcome: null, tags: [], urgent: false, serverIncome: 'ate_10', serverTime: 'mais_10', loanTime: '5_10' });
    finishBranch();
    assert.deepEqual(Array.from(state.tags), ['servidor_fora_do_perfil']);
});

test('consentimento vem antes do primeiro campo de contato', () => {
    assert.ok(html.indexOf('id="consentimento"') < html.indexOf('id="nome"'));
});

test('WhatsApp internacional combina DDI editável sem duplicar o código do país', () => {
    assert.equal(typeof buildLeadWhatsapp, 'function');
    assert.equal(buildLeadWhatsapp('(11) 99999-9999', '+55', 'empresa'), '5511999999999');
    assert.equal(buildLeadWhatsapp('912 345 678', '+351', 'exterior'), '351912345678');
    assert.equal(buildLeadWhatsapp('+351 912 345 678', '+351', 'exterior'), '351912345678');
});

test('devolutiva muda o argumento de urgência conforme o ramo', () => {
    assert.equal(typeof getAuthorityContent, 'function');
    const urgent = getAuthorityContent('processo', true);
    const regular = getAuthorityContent('empresa', false);
    assert.equal(urgent.tone, 'urgent');
    assert.match(urgent.title, /atenção rápida/i);
    assert.equal(regular.tone, 'analysis');
    assert.match(regular.points.join(' '), /contratos/i);
});

test('cada cenário recebe percentual determinístico dentro da faixa aprovada', () => {
    assert.equal(typeof getTriagePercentage, 'function');
    const branches = Object.keys(FLOW);
    const regularValues = branches.map(branch => getTriagePercentage(branch, false));
    const repeatedValues = branches.map(branch => getTriagePercentage(branch, false));

    assert.deepEqual(regularValues, repeatedValues);
    assert.ok(new Set(regularValues).size >= 8);
    for (const value of regularValues) {
        assert.ok(value >= 79.1 && value <= 89.9);
        assert.equal(Number(value.toFixed(1)), value);
    }
    assert.ok(getTriagePercentage('processo', true) >= getTriagePercentage('processo', false));
    assert.equal(getTriagePercentage('inexistente', false), 79.1);
});

test('a porcentagem continua animando com movimento reduzido ativo', () => {
    const element = { textContent: '0,0%' };
    animationFrames.length = 0;

    animatePercentage(element, 85.3, 1000);

    assert.equal(element.textContent, '0,0%');
    assert.equal(animationFrames.length, 1);
    animationFrames.shift()(250);
    assert.notEqual(element.textContent, '0,0%');
    assert.notEqual(element.textContent, '85,3%');
});

test('resposta franca por corte de qualificação não revela motivo financeiro', () => {
    assert.equal(typeof getDismissalContent, 'function');
    const content = getDismissalContent('valor_baixo');
    const fullText = [content.title, content.lead, content.guidance].join(' ').toLowerCase();
    assert.doesNotMatch(fullText, /valor|barat|baixo|ticket|honorário|custar|custo/);
    assert.match(fullText, /orientação clara/);
    assert.match(fullText, /consumidor\.gov\.br/);
});
