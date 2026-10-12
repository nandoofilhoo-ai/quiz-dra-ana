# Documentação do projeto

Esta pasta reúne o contexto operacional do funil de triagem da Dra. Ana Maria de Magalhães em Direito Bancário.

## Estado comprovado da primeira fase

- O formulário web usa o visual aprovado `Sculpted Bordeaux`; o seletor de variações foi removido.
- As regras consolidadas de triagem estão implementadas no frontend. A devolutiva precede a captura de contato, e dispensas confirmadas não coletam contato.
- `n8n_workflow.json` é um template local inativo. Os nós que escrevem dados estão desabilitados e o arquivo não contém CRM ou token literal.
- Laudo, CRM, GA4/GTM e domínio permanecem adiados.
- Não houve publicação, deploy público ou configuração remota de automações nesta fase.

## Documentos

- `event-contract.md`: contrato canônico de eventos, consentimento e limites de PII.
- `social-automation-spec.md`: roteiro de automações sociais e mensagens aprovadas para configuração futura.
- `manychat-context.md`: resumo executivo, arquitetura, integrações, estado e pendências.
- `manychat-flow-spec.md`: especificação operacional da triagem e regras de qualificação.

Para trabalho no ManyChat, leia primeiro o contexto, a especificação do fluxo e a automação social. Para o formulário ou n8n, consulte também `CHECKLIST.md`, o código e os testes.

## Pendências para publicação e integrações

Nada desta lista deve ser tratado como configurado sem evidência na conta correspondente.

- ManyChat/Instagram: acesso administrativo válido à conta ManyChat, canal Instagram profissional conectado e permissões para configurar gatilhos, palavras-chave, comentários, novo seguidor quando disponível e fluxos visuais. A tentativa de auditoria com o token disponibilizado retornou HTTP 401; além disso, a API pública não cria esses gatilhos ou fluxos visuais.
- TikTok: acesso à conta e confirmação das permissões/capacidades disponíveis no canal antes de qualquer automação ou publicação de CTA.
- n8n: URL base da instância, chave de API pública com escopo necessário, URL final do webhook e destino aprovado para os dados. O template local continua inativo até essa configuração segura.
- Publicação: domínio/URL oficial do formulário, projeto Vercel ou equivalente com permissão de deploy, confirmação do número comercial, horários de contato e dados institucionais que poderão aparecer ao público.
- CRM e mensuração: decisão do CRM, acesso técnico e mapeamento de campos; IDs e configuração de GA4/GTM quando esses itens saírem de standby.

## Regra de precedência

Decisões confirmadas pela cliente prevalecem sobre hipóteses do código, rascunhos ou sugestões. Quando uma decisão ainda estiver aberta, o item deve permanecer marcado como `PENDENTE DE CONFIRMAÇÃO`.

## Fontes usadas

- briefing Word `Fluxo de triagem ManyChat – Direito Bancário`;
- `chat.md`;
- `quiz-flow.js`;
- `n8n_workflow.json`;
- `CHECKLIST.md`.
