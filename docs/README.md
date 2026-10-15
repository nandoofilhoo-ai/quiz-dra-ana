# Documentação do projeto

Esta pasta reúne o contexto operacional do funil de triagem da Dra. Ana Maria de Magalhães em Direito Bancário.

## Estado comprovado da primeira fase

- O formulário web usa o visual aprovado `Sculpted Bordeaux`; o seletor de variações foi removido.
- O frontend cobre e testa as regras consolidadas de triagem, incluindo as opções completas de processo e financiamento, devolutiva antes da captura de contato e dispensas confirmadas sem coleta.
- A tela de devolutiva exibe um score visual de urgência entre 75,3% e 98,6%, sobre uma barra semafórica de 0% a 100%, com o marcador na posição correspondente ao score e animação sincronizada; esse número é apenas apresentação da triagem, não é probabilidade, promessa de resultado ou critério automático de dispensa.
- A tela final informa que as respostas serão repassadas ao especialista e orienta deixar os documentos relacionados separados para o contato, sem sugerir que uma nova análise ainda será realizada nessa etapa.
- `n8n_workflow.json` permanece como template local inativo; o workflow remoto foi validado com eventos sintéticos e gravou nos caminhos de Google Sheets, mantendo o CRM desabilitado.
- Laudo, CRM, GA4/GTM e domínio permanecem adiados.
- O formulário está publicado na Vercel e o webhook remoto foi verificado; domínio personalizado e automações sociais continuam pendentes.

## Documentos

- `event-contract.md`: contrato canônico de eventos, consentimento e limites de PII.
- `social-automation-spec.md`: roteiro de automações sociais e mensagens documentadas/propostas para configuração futura.
- `manychat-context.md`: resumo executivo, arquitetura, integrações, estado e pendências.
- `manychat-flow-spec.md`: especificação operacional da triagem e regras de qualificação.

Para trabalho no ManyChat, leia primeiro o contexto, a especificação do fluxo e a automação social. Para o formulário ou n8n, consulte também `CHECKLIST.md`, o código e os testes.

## Pendências para publicação e integrações

Nada desta lista deve ser tratado como configurado sem evidência na conta correspondente.

- ManyChat/Instagram: acesso administrativo válido à conta ManyChat, canal Instagram profissional conectado e permissões para configurar gatilhos, palavras-chave, comentários, novo seguidor quando disponível e fluxos visuais. A tentativa de auditoria com o token disponibilizado retornou HTTP 401; além disso, a API pública não cria esses gatilhos ou fluxos visuais.
- TikTok: acesso à conta e confirmação das permissões/capacidades disponíveis no canal antes de qualquer automação ou publicação de CTA.
- n8n: endpoint remoto e credencial administrativa foram validados; os eventos sintéticos chegaram às abas `Analytics_Funil` e `Leads_Qualificados`. A chave permanece fora do repositório.
- Publicação: Vercel validada; domínio personalizado, confirmação do número comercial, horários de contato e dados institucionais continuam pendentes.
- CRM e mensuração: decisão do CRM, acesso técnico e mapeamento de campos; IDs e configuração de GA4/GTM quando esses itens saírem de standby.

## Regra de precedência

Decisões confirmadas pela cliente prevalecem sobre hipóteses do código, rascunhos ou sugestões. Quando uma decisão ainda estiver aberta, o item deve permanecer marcado como `PENDENTE DE CONFIRMAÇÃO`.

## Fontes usadas

- briefing Word `Fluxo de triagem ManyChat – Direito Bancário`;
- `chat.md`;
- `quiz-flow.js`;
- `n8n_workflow.json`;
- `CHECKLIST.md`.
