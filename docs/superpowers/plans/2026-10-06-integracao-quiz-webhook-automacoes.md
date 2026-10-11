# Integração do Quiz com Webhook e Automações — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o quiz enviar eventos confiáveis ao n8n e permitir gravação em Google Sheets, encaminhamento ao CRM e acionamento das automações, sem expor credenciais ou dados pessoais em código versionado.

**Architecture:** O frontend terá um contrato único de eventos para `analytics` e `lead_submission`, enviando os eventos ao webhook n8n e, quando aplicável, ao `dataLayer` do GTM. O n8n validará/normalizará o payload, registrará analytics e leads nas abas correspondentes, e depois chamará o CRM. Falhas de integração serão observáveis e não deverão apagar a experiência do usuário.

**Tech Stack:** HTML/CSS/JavaScript vanilla, `navigator.sendBeacon`/`fetch`, n8n, Google Sheets, GTM/GA4 e HTTP API do CRM PipeZ.

**Spec:** `docs/manychat-context.md`, `docs/manychat-flow-spec.md`, `CHECKLIST.md`.

## Global Constraints

- Nunca versionar tokens, credenciais, IDs privados ou dados reais de leads.
- Não enviar nome, WhatsApp ou outros dados pessoais para GA4.
- Manter o consentimento LGPD antes da captura do lead.
- Uma falha de telemetria não pode impedir a conclusão do quiz.
- Não tratar critérios comerciais pendentes como regra implementada.
- Usar as abas `Analytics_Funil` e `Leads_Qualificados` já criadas na planilha compartilhada.

## Review Focus

- Payload do frontend e expressões n8n precisam usar os mesmos nomes de campos.
- `sendBeacon` pode não informar erro ao usuário; o fluxo deve continuar mesmo com falha.
- Reenvio do navegador não deve criar leads duplicados sem uma estratégia de idempotência por `sessionId`/evento.
- Analytics deve preservar UTMs sem incluir PII.
- Credenciais e IDs devem ser configuráveis no ambiente n8n/Vercel, nunca no repositório.

### Task 1: Consolidar contrato de eventos

**Files:**
- Create: `docs/event-contract.md`
- Modify: `CHECKLIST.md`

**Interfaces:**
- Produces: contrato documentado para `analytics`, `lead_submission`, eventos GTM e campos obrigatórios/opcionais.

- [ ] Documentar exemplos sem dados reais para `analytics` e `lead_submission`.
- [ ] Definir nomes canônicos: `session_id`, `event_type`, `timestamp`, `branch`, `tags`, `value_range`, `answers`, UTMs e campos de contato.
- [ ] Registrar compatibilidade temporária, se necessária, com os nomes atuais do frontend.
- [ ] Atualizar o checklist com a decisão e as pendências de configuração externa.

### Task 2: Corrigir transporte e telemetria do frontend

**Files:**
- Modify: `quiz-flow.js`
- Test: `tests/flow.test.js` ou novo teste focado em payload

**Interfaces:**
- Consumes: estado atual do quiz, UTMs da URL e `N8N_WEBHOOK_URL`.
- Produces: eventos normalizados para n8n e `dataLayer` sem PII.

- [ ] Adicionar helper de envio que preserve `sessionId`, UTMs, ramo, etapa, etiquetas e timestamp.
- [ ] Fazer `sendAnalyticsEvent` enviar `event_type: 'analytics'` sem nome/WhatsApp.
- [ ] Fazer `handleLeadSubmit` enviar os campos que o n8n realmente consumirá, incluindo problema/ramo, faixa de valor, respostas e origem.
- [ ] Disparar `quiz_step_view`, `quiz_qualified` e `quiz_disqualified` no `dataLayer`.
- [ ] Manter o redirecionamento ao WhatsApp mesmo quando o webhook falhar.
- [ ] Cobrir payload qualificado, desqualificado, UTMs ausentes e evento sem `navigator.sendBeacon`.

### Task 3: Normalizar e proteger o workflow n8n

**Files:**
- Modify: `n8n_workflow.json`
- Modify: `docs/manychat-context.md`

**Interfaces:**
- Consumes: contrato de `docs/event-contract.md`.
- Produces: linhas compatíveis com `Analytics_Funil`/`Leads_Qualificados`, chamada ao PipeZ e resposta/observabilidade de execução.

- [ ] Corrigir o mapeamento da aba `Leads_Qualificados` para os nomes reais do payload.
- [ ] Mapear UTMs e detalhes de origem na aba de analytics.
- [ ] Validar `event_type`, `session_id` e timestamp antes dos nós de escrita.
- [ ] Adicionar normalização para payloads antigos durante a transição, sem esconder erro de contrato.
- [ ] Configurar idempotência por evento/session quando a instância n8n suportar armazenamento adequado.
- [ ] Substituir placeholders por referências configuráveis de credencial, sem inserir segredos no JSON.
- [ ] Definir tratamento de erro para Sheets e PipeZ e registrar a pendência de endpoint/token real.

### Task 4: Configurar GTM/GA4 e eventos de conversão

**Files:**
- Modify: `index.html`
- Modify: `docs/event-contract.md`
- Modify: `CHECKLIST.md`

**Interfaces:**
- Consumes: `dataLayer` events from Task 2 and IDs externos fornecidos pelo cliente.
- Produces: tags GA4 disparadas por eventos customizados e conversão `quiz_qualified`.

- [ ] Inserir snippets GTM somente após receber o Container ID.
- [ ] Criar variáveis/acionadores para os três eventos customizados.
- [ ] Criar tags GA4 sem parâmetros de PII.
- [ ] Validar no GTM Preview e no GA4 DebugView.

### Task 5: Ligar automações e validar ponta a ponta

**Files:**
- Modify: `docs/manychat-context.md`
- Modify: `CHECKLIST.md`

**Interfaces:**
- Consumes: workflow n8n publicado, endpoint real, IDs da planilha, credencial Google e PipeZ.
- Produces: fluxo validado do quiz até Sheets/CRM/WhatsApp e, quando autorizado, gatilho ManyChat.

- [ ] Configurar URL pública HTTPS do webhook n8n no frontend.
- [ ] Testar analytics sem contato e lead qualificado com payload fictício.
- [ ] Confirmar linhas nas duas abas e chamada ao CRM sem dados reais.
- [ ] Validar que desqualificados não entram em `Leads_Qualificados`.
- [ ] Definir o evento que aciona ManyChat e as condições de consentimento/canal antes de ativar automação real.
- [ ] Atualizar o checklist com evidências e pendências remanescentes.

## Spec coverage

- Webhook e analytics: Tasks 1–3.
- GTM/GA4: Tasks 2 e 4.
- Sheets e CRM: Tasks 1, 3 e 5.
- ManyChat: Task 5, condicionado a acesso e definição do gatilho.
- LGPD e ausência de PII no analytics: constraints, Tasks 2 e 4.

