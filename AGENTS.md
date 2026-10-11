# Instruções para agentes

## Objetivo do projeto

Este repositório contém um funil de triagem para a atuação da Dra. Ana Maria de Magalhães em Direito Bancário. O funil combina quiz web na Vercel, automações ManyChat, n8n para analytics/CRM e encaminhamento para atendimento humano.

## Antes de alterar qualquer coisa

1. Leia `docs/README.md`.
2. Para trabalho no ManyChat, leia `docs/manychat-context.md` e `docs/manychat-flow-spec.md`.
3. Consulte `CHECKLIST.md` para o estado atual.
4. Não invente critérios comerciais ainda pendentes de confirmação.
5. Nunca versionar tokens, credenciais, IDs de planilhas, chaves de API ou dados pessoais.

## Fontes de verdade

1. Decisões confirmadas pela cliente.
2. `docs/manychat-flow-spec.md`, quando a regra estiver consolidada.
3. Código e testes, para comportamento implementado.
4. `CHECKLIST.md`, para status e pendências.

Itens não confirmados devem ser marcados como pendentes, nunca tratados como requisito.

## Regras essenciais

- O público prioritário é formado por empresários e poucos produtos de pessoa física com ticket adequado.
- O bot faz triagem inicial; não promete resultado, desconto, prazo de solução ou contratação.
- Uma pergunta por mensagem; botões para respostas fechadas; texto livre apenas em “Meu caso é outro”.
- “Não sei” não elimina automaticamente o lead.
- O contato é solicitado depois da devolutiva.
- Casos dispensados não devem ter contato coletado; recebem orientação útil e opção de refazer as perguntas.

## Integrações

- Frontend: `index.html`, `style.css`, `quiz-flow.js`.
- n8n: `n8n_workflow.json`.
- Testes: `tests/`.
- O webhook, credenciais e IDs definitivos ainda precisam de configuração.
- O número comercial atualmente presente no frontend é `5524992331416`; confirmar antes de trocar ou publicar.

## Segurança e LGPD

- Não registrar dados reais de leads em documentação, testes ou logs permanentes.
- Manter a mensagem de consentimento antes da captura de dados.
- Não expor documentos jurídicos em exemplos públicos.

## Critério de conclusão

Uma alteração só deve ser considerada concluída depois de testes proporcionais ao risco e atualização da documentação ou checklist quando o comportamento, a integração ou uma decisão de negócio mudar.

