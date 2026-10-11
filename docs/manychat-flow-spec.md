# Especificação do fluxo ManyChat

## Abertura

Mensagem-base:

> Olá! Aqui é o atendimento inicial da Dra. Ana Magalhães, advogada especialista em Direito Bancário. Vou fazer algumas perguntas rápidas, de tocar no botão, para entender o seu caso. Leva cerca de 1 minuto e depois um advogado analisa a sua situação. Suas respostas são sigilosas.

Pergunta inicial: “O que está acontecendo com você? Se for mais de uma coisa, escolha a mais urgente.”

| Botão | Ramo | Etiqueta base |
|---|---|---|
| Banco me processou | processo | `processo` |
| Empresa endividada | empresa | `empresa` |
| Conta bloqueada | bloqueio | `bloqueio` |
| Recebíveis retidos | recebiveis | `recebiveis` |
| Sócio ou avalista | avalista | `avalista` |
| Imóvel em atraso | imovel | `imovel` |
| Servidor de carreira | servidor | `servidor` |
| Golpe falsa central | golpe | `golpe` |
| Meu caso é outro | outro | `outro` |

## Regras gerais

- uma pergunta por mensagem;
- botões para respostas fechadas;
- texto livre somente no ramo `outro`;
- linguagem simples e centrada no relato do cliente;
- “Não sei” segue para análise quando não houver regra específica;
- a devolutiva vem antes da captura de contato;
- o bot se identifica como atendimento inicial automatizado;
- o atendimento humano avalia documentos, honorários e contratação.

## Ramos

### 1 Banco me processou

1. O que você recebeu? — cobrança em poucos dias; penhora ou bloqueio; leilão; busca e apreensão; não sei.
2. Quando recebeu? — hoje ou ontem; menos de 15 dias; mais de 15 dias; não lembro.
3. A dívida é de quem? — empresa; pessoal; avalista ou fiador.
4. Valor cobrado? — até R$ 50 mil; R$ 50 a 100 mil; R$ 100 a 300 mil; R$ 300 a 500 mil; acima de R$ 500 mil; não sei.
5. Já tem advogado? — não; tenho, mas quero outra opinião; tenho.

Hoje/ontem e menos de 15 dias marcam `urgente`. “Tenho” encaminha à dispensa de quem já possui advogado. Documentos: documento do oficial e contrato da dívida.

### 2 Conta bloqueada

1. Quem bloqueou? — Justiça por processo; próprio banco; não sei.
2. Quando? — hoje ou ontem; nesta semana; há mais de uma semana.
3. Quanto? — até R$ 20 mil; R$ 20 a 100 mil; R$ 100 a 500 mil; acima de R$ 500 mil; não sei.
4. Destino do dinheiro? — folha; fornecedores e impostos; reserva; outro.
5. Origem bancária? — sim; não, outra origem; não sei.

Bloqueio judicial é `urgente`. Origem trabalhista ou fiscal recebe `fora_do_bancario` e aguarda decisão sobre atendimento. Documentos: extrato e número do processo, se houver.

### 3 Recebíveis retidos

1. O que está retido? — maquininha; duplicatas/boletos; aplicação/saldo; não sei.
2. Ligado a qual dívida? — capital de giro; antecipação; cheque especial/conta garantida; não sei.
3. Percentual retido? — menos de 30%; 30% a 60%; mais de 60%; praticamente tudo.
4. Parcelas? — em dia; atrasadas; renegociadas e sem pagamento.
5. Valor da dívida? — faixas padrão; não sei.

Mais de 60% ou praticamente tudo marca `urgente`. Documentos: contrato e extrato da maquininha ou conta vinculada.

### 4 Empresa endividada

1. Dívida principal? — Pronampe/FGI; capital de giro; cheque especial; cartão; mais de uma.
2. Situação? — em dia, mas sufocando caixa; atrasadas; renegociadas; negativação/protesto; juros altos.
3. Total devido? — faixas padrão; não sei.
4. Garantia? — aval dos sócios; imóvel/veículo; recebíveis; fundo garantidor; não sei.
5. Empresa funciona? — faturando normalmente; faturando pouco; parada.

“Recebíveis” adiciona `recebiveis`; “aval dos sócios” adiciona `avalista`. Documentos: contratos e extratos dos últimos três meses.

### 5 Sócio ou avalista

1. Situação? — avalista da empresa; sócio de empresa devedora; saiu da sociedade; avalista de outra pessoa.
2. O que aconteceu? — cobranças; negativação; processo; bloqueio de conta/bem.
3. Valor? — faixas padrão; não sei.
4. O que teme perder? — moradia; outros imóveis; veículos; salário/dinheiro; não sei.
5. Empresa ativa? — sim; parada; encerrada.

Processo ou bloqueio marca `urgente`. Documentos: contrato assinado e contrato social.

### 6 Imóvel em atraso

1. Parcelas atrasadas? — 1 ou 2; 3 ou mais; não sei.
2. Aviso recebido? — nenhum; cobrança; cartório; leilão; já foi a leilão.
3. Financiador? — Caixa; outro banco; construtora/incorporadora.
4. Imóvel? — moradia; investimento; comercial.
5. Saldo a pagar? — faixas padrão; não sei.

Cartório, leilão ou imóvel já leiloado marca `urgente`. Documentos: contrato e notificações.

### 7 Servidor de carreira

1. Vínculo? — federal; estadual; municipal; militar; aposentado/pensionista.
2. Renda bruta? — até R$ 10 mil; R$ 10 a 20 mil; R$ 20 a 30 mil; acima de R$ 30 mil.
3. Dívida principal? — consignado; débito em conta; cartão consignado; cartão/cheque especial; várias.
4. Tempo de serviço? — menos de 5 anos; 5 a 10; mais de 10.
5. Tempo de empréstimos/refinanciamentos? — menos de 5 anos; 5 a 10; mais de 10.

Renda a partir de R$ 10 mil, mais de 10 anos de serviço e pelo menos 5 anos de empréstimos recebem `servidor_nulidade` e atendimento direto. Os demais recebem `servidor_fora_do_perfil` e seguem sem prioridade. Não há filtro de valor nem oferta de laudo. Documentos: contracheque e lista das dívidas.

### 8 Golpe da falsa central

1. Como aconteceu? — ligação falsa com PIX; instalação de aplicativo; empréstimo na ligação; outro golpe.
2. Prejuízo? — até R$ 30 mil; R$ 30 a 50 mil; R$ 50 a 100 mil; acima de R$ 100 mil.
3. Quando? — últimos dias; último mês; 1 a 3 meses; mais de 3 meses.
4. O que fez? — boletim e reclamação; uma das duas; nada.
5. Resposta do banco? — negou; não respondeu; devolveu parte; devolveu tudo.

“Outro golpe” vai à dispensa fora do escopo. “Devolveu tudo” vai à dispensa de prejuízo já devolvido. Últimos dias marca `urgente`. Até R$ 30 mil é corte sugerido. Documentos: boletim, comprovante do PIX e resposta do banco.

### 9 Meu caso é outro

1. Problema com dívida da empresa, dívida pessoal ou outro assunto bancário?
2. Existe processo, bloqueio ou prazo? — sim; não; não sei.
3. Conte em uma ou duas frases o que está acontecendo. — texto livre.

Não há dispensa automática; o relato sempre segue para atendimento humano.

## Qualificação comercial

Aplicável aos ramos de processo, recebíveis, empresa, avalista e imóvel:

| Faixa | Etiqueta | Ação |
|---|---|---|
| Até R$ 50 mil | `laudo` | oferecer laudo; se recusar, dispensar |
| R$ 50 a 100 mil | `laudo_fechar` | oferecer laudo e permitir tentativa comercial |
| R$ 100 a 300 mil | `revisar` | fechamento normal e análise humana |
| R$ 300 a 500 mil | `revisar` | fechamento normal e análise humana |
| Acima de R$ 500 mil | `prioridade_maxima` | aviso imediato e contato no mesmo dia |
| Não sei | `revisar` | fechamento normal e análise humana |

No golpe, o corte é pelo prejuízo. O ramo de servidor não usa filtro de valor.

O preço do laudo e o prazo de retorno são `PENDENTES DE CONFIRMAÇÃO` e não podem ser inventados no bot.

## Oferta e dispensas

Oferta de laudo:

> Pelo valor da dívida, uma ação judicial tende a custar mais do que o resultado. Para casos assim, o escritório oferece um laudo de análise do contrato. Ele mostra se há cobranças indevidas e serve de base para negociar com o banco. Quer saber como funciona?

Botões: `Quero saber` e `Agora não`.

Dispensas previstas:

- valor abaixo do mínimo: orientar consumidor.gov.br, Procon ou ouvidoria;
- golpe fora do escopo: orientar boletim, contestação, Banco Central e Procon;
- prejuízo já devolvido: explicar que não há prejuízo pendente;
- já tem advogado: orientar a tratar prazos com o advogado atual.

Toda dispensa termina com `Refazer as perguntas`. Critérios ainda não confirmados devem permanecer desativados até decisão explícita.

## Captura e consentimento

Depois da devolutiva, pedir nome completo, WhatsApp com DDD, cidade/estado e melhor horário: manhã, tarde ou noite. Pular o WhatsApp quando o canal já fornecer o identificador adequado.

Mensagem obrigatória antes da coleta:

> Ao enviar seus dados, você autoriza o nosso contato por WhatsApp ou telefone. Suas informações são tratadas com sigilo, conforme a LGPD.

## Handoff

Mensagem-base:

> Pronto, [nome]. Recebi as suas respostas e já encaminhei o seu caso. Um advogado da equipe da Dra. Ana Magalhães fala com você em até [prazo]. Para adiantar a análise, separe se puder: [documentos do ramo].

Para `urgente`, substituir a frase de prazo por: “Como o seu caso tem prazo, ele entrou na fila de prioridade.” Não publicar `[prazo]` até a confirmação da cliente.

