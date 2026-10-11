# Especificação do fluxo ManyChat

Status: fonte operacional consolidada para a primeira fase. O fluxo faz triagem inicial; não promete resultado, desconto, contratação, prazo de solução ou disponibilidade.

## Abertura

Mensagem-base:

> Olá! Aqui é o atendimento inicial da Dra. Ana Magalhães, advogada especialista em Direito Bancário. Vou fazer algumas perguntas rápidas, de tocar no botão, para entender o seu caso. Depois da devolutiva, se houver continuidade, pediremos seus dados para encaminhar ao atendimento humano. Suas respostas são sigilosas.

Pergunta inicial: “O que está acontecendo com você? Se for mais de uma coisa, escolha a mais urgente.”

| Botão | Ramo | Etiqueta base |
|---|---|---|
| Banco me processou | `processo` | `processo` |
| Empresa endividada | `empresa` | `empresa` |
| Conta bloqueada | `bloqueio` | `bloqueio` |
| Recebíveis retidos | `recebiveis` | `recebiveis` |
| Sócio ou avalista | `avalista` | `avalista` |
| Financiamento imobiliário | `imovel` | `imovel` |
| Servidor de carreira | `servidor` | `servidor` |
| Golpe PIX de falsa central | `golpe` | `golpe` |
| Residente no exterior | `exterior` | `exterior` |
| Meu caso é outro | `outro` | `outro` |

## Regras gerais

- Uma pergunta por mensagem.
- Botões para respostas fechadas; texto livre somente no ramo `outro`.
- “Não sei” segue para análise quando não houver regra específica.
- A devolutiva vem antes da captura de contato.
- Casos dispensados não coletam contato; recebem orientação útil e `Refazer as perguntas`.
- O bot se identifica como atendimento inicial automatizado.
- O atendimento humano avalia documentos, honorários e contratação.
- O consentimento LGPD aparece antes de nome, WhatsApp, cidade, estado e preferência de contato.
- Faixas de valor registram contexto e priorização; não são corte automático de atendimento.

## Ramos

### 1. Banco me processou

Ramo sempre urgente; a urgência não é reduzida pelo meio de comunicação nem pelo valor.

1. Como você foi comunicado? — oficial de justiça; carta dos Correios; WhatsApp; outro meio; não sei.
2. Quanto está sendo cobrado? — faixa de valor; não sei.
3. Quais bens ou valores estão em risco? — conta; imóvel; veículo; recebíveis; salário/dinheiro; não sei. Permitir múltipla seleção.

Registrar `urgente: true` e encaminhar para atendimento humano. Não dispensar automaticamente por valor. A forma de comunicação, o valor e os bens em risco são suficientes para a triagem inicial; documentos só são solicitados no atendimento humano.

### 2. Conta bloqueada

1. Quem originou o bloqueio? — banco; Justiça; não sei.
2. A origem é bancária, fiscal ou trabalhista? — bancária; fiscal; trabalhista; não sei.
3. O que foi bloqueado e qual o impacto? — conta; recebíveis; salário; reserva; outro; não sei.

Origem fiscal ou trabalhista recebe orientação para advogado da área correspondente, Defensoria ou entidade de classe, sem captura de contato e sem ser tratada como atuação bancária. “Não sei” segue para análise.

### 3. Recebíveis retidos

1. O que está retido? — maquininha; duplicatas/boletos; aplicação/saldo; não sei.
2. A retenção está ligada a qual dívida? — capital de giro; antecipação; cheque especial/conta garantida; não sei.
3. Qual a proporção aproximada? — menos de 30%; 30% a 60%; mais de 60%; praticamente tudo; não sei.
4. As parcelas estão — em dia; atrasadas; renegociadas e sem pagamento; não sei.

Mais de 60% ou praticamente tudo pode marcar urgência para análise. Não há oferta de laudo nem dispensa automática por faixa.

### 4. Empresa endividada

1. Qual a dívida principal? — Pronampe/FGI; capital de giro; cheque especial; cartão; mais de uma; não sei.
2. Qual a situação? — em dia, mas sufocando caixa; atrasadas; renegociadas; negativação/protesto; juros altos; não sei.
3. Qual a faixa do total devido? — faixa de valor; não sei.
4. Há garantia? — aval dos sócios; imóvel/veículo; recebíveis; fundo garantidor; não sei.
5. A empresa funciona? — faturando normalmente; faturando pouco; parada; não sei.

“Recebíveis” adiciona `recebiveis`; “aval dos sócios” adiciona `avalista`. A faixa não gera corte automático.

### 5. Sócio ou avalista

1. Qual a situação? — avalista da empresa; sócio de empresa devedora; saiu da sociedade; avalista de outra pessoa; não sei.
2. O que aconteceu? — cobranças; negativação; processo; bloqueio de conta/bem; não sei.
3. Qual a faixa do valor? — faixa de valor; não sei.
4. O que teme perder? — moradia; outros imóveis; veículos; salário/dinheiro; não sei.
5. A empresa está — ativa; parada; encerrada; não sei.

Processo ou bloqueio pode marcar urgência. Não há oferta de laudo nem corte automático.

### 6. Financiamento imobiliário

Abrange tanto quem está inadimplente quanto quem ainda está adimplente, mas tem parcela insustentável.

1. Como estão as parcelas? — em dia, mas insustentáveis; atrasadas; renegociadas; não sei.
2. Que aviso foi recebido? — nenhum; cobrança; cartório; leilão; já foi a leilão; não sei.
3. Quem financiou? — Caixa; outro banco; construtora/incorporadora; não sei.
4. Qual o uso do imóvel? — moradia; investimento; comercial; não sei.
5. Qual a faixa do saldo? — faixa de valor; não sei.

Cartório, leilão ou imóvel já leiloado pode marcar urgência. A faixa não é corte automático.

### 7. Servidor de carreira

1. Qual o vínculo? — federal; estadual; municipal; militar; aposentado/pensionista; não sei.
2. Qual a faixa da renda bruta? — faixas de renda; não sei.
3. Qual a dívida principal? — consignado; débito em conta; cartão consignado; cartão/cheque especial; várias; não sei.
4. Há quanto tempo existem empréstimos/refinanciamentos? — faixas de tempo; não sei.

O ramo segue para análise sem oferta de laudo. Não criar corte automático ou promessa a partir de renda/tempo enquanto a regra comercial não estiver confirmada.

### 8. Golpe PIX de falsa central

1. Como aconteceu? — ligação falsa com PIX; instalação de aplicativo; empréstimo na ligação; não sei.
2. Qual a faixa do prejuízo? — faixa de valor; não sei.
3. Quando aconteceu? — últimos dias; último mês; 1 a 3 meses; mais de 3 meses; não sei.
4. O que foi feito? — boletim e reclamação; uma das duas; nada; não sei.
5. Qual foi a resposta do banco? — negou; não respondeu; devolveu parte; devolveu tudo; não sei.

Somente a falsa central com PIX está no escopo. Outro tipo de golpe recebe orientação geral de boletim, contestação, Banco Central ou Procon e é dispensado sem captura de contato. “Devolveu tudo” recebe orientação de que não há prejuízo pendente e opção de refazer. Últimos dias podem marcar urgência. Não há oferta de laudo.

### 9. Residente no exterior

1. Qual é a situação? — tenho conta ou dívida no Brasil; quero investir no Brasil; imóvel no Brasil; outro assunto bancário; não sei.
2. Existe bloqueio, cobrança ou prazo? — sim; não; não sei.

“Quero investir no Brasil” é a nomenclatura aprovada. “Não sei” segue para análise; não presumir elegibilidade comercial.

### 10. Meu caso é outro

1. O problema envolve — Dívida da empresa; Dívida pessoal; Outro assunto bancário.
2. Existe processo, bloqueio ou prazo? — sim; não; não sei.
3. Conte em uma ou duas frases o que está acontecendo. — texto livre.

Não há dispensa automática; o relato segue para atendimento humano depois da devolutiva.

## Qualificação e dispensas

Não há oferta de laudo na V1. Nenhuma faixa de valor, isoladamente, dispensa o caso. Toda dispensa deve estar ligada a uma regra específica acima, ter orientação útil e terminar com `Refazer as perguntas`, sem captura de contato.

Dispensas confirmadas:

- origem fiscal ou trabalhista em conta bloqueada: orientar advogado da área, Defensoria ou entidade de classe;
- golpe fora da falsa central com PIX: orientar boletim, contestação, Banco Central ou Procon;
- prejuízo integralmente devolvido: explicar que não há prejuízo pendente;
- caso já acompanhado por advogado, se essa pergunta for adicionada ao fluxo: orientar a tratar prazos com o advogado atual.

Não inventar preço, prazo, disponibilidade, limite de atendimento ou critério comercial.

## Captura e consentimento

Para este formulário web, depois da devolutiva, pedir nome completo, WhatsApp com DDD obrigatório, cidade/estado e melhor período: manhã ou tarde. A exceção de WhatsApp nulo pertence somente à variante futura de lead nativo ManyChat descrita em `docs/event-contract.md`; ela exige `channel`, `channel_user_id` e consentimento para contato nesse canal.

Mensagem obrigatória antes da coleta:

> Ao enviar seus dados, você autoriza o nosso contato por WhatsApp ou telefone. Suas informações são tratadas com sigilo, conforme a LGPD.

## Handoff

Mensagem-base:

> Pronto, [nome]. Recebi as suas respostas e encaminhei o seu caso para a análise inicial. Um advogado da equipe da Dra. Ana Magalhães falará com você após a triagem da equipe. Para adiantar a análise, separe, se puder, os documentos relacionados ao seu ramo.

Para `urgente`:

> Como o seu caso pode envolver prazo, ele foi sinalizado para prioridade de análise. Isso não representa garantia de resultado ou de atendimento em prazo determinado.

Não publicar prazo entre colchetes nem afirmar que uma integração externa foi concluída enquanto o n8n estiver desativado.
