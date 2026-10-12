# Conclusão da Primeira Fase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a primeira versão local do formulário no visual Sculpted, com as regras aprovadas na reunião, sem laudo e com materiais de automação social e integração prontos para ativação quando os acessos externos forem válidos.

**Architecture:** A interface continuará como aplicação HTML/CSS/JavaScript sem dependências. `quiz-flow.js` será a fonte executável do fluxo, `docs/event-contract.md` fixará o contrato futuro com n8n e `docs/social-automation-spec.md` será o roteiro de configuração do ManyChat/TikTok. Integrações adiadas ou sem acesso válido permanecerão inativas e explicitamente documentadas.

**Tech Stack:** HTML5, CSS3, JavaScript vanilla, Node.js test runner, JSON de workflow n8n e API pública do ManyChat.

**Spec:** `CHECKLIST.md`, `AGENTS.md`, `docs/README.md`, `docs/manychat-context.md` e decisões confirmadas no registro de 2026-10-11.

## Global Constraints

- O visual aprovado é `Sculpted Bordeaux`; o seletor de apresentação não aparece na versão entregue.
- O laudo fica fora da primeira versão, sem oferta, caminho ou coleta de contato associada.
- CRM, GA4/GTM e domínio permanecem em standby.
- O número `5524992331416` não deve ser alterado nem publicado como definitivo sem confirmação.
- Não versionar tokens, credenciais, IDs privados, documentos jurídicos ou dados reais de leads.
- O consentimento LGPD deve aparecer antes da captura de nome, WhatsApp, cidade/estado e preferência de contato.
- Casos dispensados não coletam contato; recebem orientação útil e opção de refazer.
- “Não sei” não elimina automaticamente o lead.
- Não prometer resultado, economia, contratação, prazo de solução ou retorno ainda não confirmado.
- Uma pergunta por tela/mensagem; texto livre apenas em “Meu caso é outro”.
- Mobile mantém as opções iniciais em lista vertical.
- O mapa visual de público é: Processo `PF/PJ`; Empresa `PJ`; Conta bloqueada `PF/PJ`; Recebíveis `PJ`; Sócio ou avalista `PF/PJ`; Financiamento imobiliário `PF/PJ`; Servidor `PF`; Golpe PIX `PF`; Residente no exterior `PF`; Outro `PF/PJ`.
- Na ausência de novo corte comercial confirmado, faixa de valor serve para priorização e contexto, não para dispensa automática.
- Todo ramo `Banco me processou` é urgente; a forma de comunicação não reduz a cautela com prazo judicial.
- Origem fiscal ou trabalhista em `Conta bloqueada` recebe orientação para advogado da área correspondente, Defensoria ou entidade de classe, sem captura de contato.

## Review Focus

- Caso judicial urgente com dívida baixa deve seguir para atendimento, sem cair em corte financeiro.
- Conta bloqueada por causa fiscal ou trabalhista deve receber orientação fora do bancário sem captura de contato.
- Financiamento imobiliário deve aceitar pessoa adimplente com parcela insustentável.
- Golpe diferente de PIX de falsa central deve ser dispensado sem oferta de laudo.
- Falha ou ausência do webhook não pode bloquear o encaminhamento ao WhatsApp, mas a interface não deve afirmar que uma integração externa foi concluída.

---

### Task 1: Consolidar a fonte de verdade e os contratos

**Files:**
- Create: `docs/event-contract.md`
- Create: `docs/social-automation-spec.md`
- Modify: `docs/manychat-context.md`
- Modify: `docs/manychat-flow-spec.md`
- Modify: `CHECKLIST.md`

**Interfaces:**
- Produces: contrato canônico de eventos e texto operacional aprovado para as Tasks 2–4.

- [ ] **Step 1: Atualizar o contexto para as decisões confirmadas**

Registrar explicitamente: Sculpted aprovado; laudo removido da V1; CRM, GA4/GTM e domínio adiados; conta ManyChat não auditável enquanto o token retornar 401; n8n não auditável sem URL base e chave `X-N8N-API-KEY`.

- [ ] **Step 2: Atualizar a especificação funcional**

Substituir nomenclaturas por `Financiamento imobiliário`, `Golpe PIX de falsa central` e `Residente no exterior`; alterar `Quero comprar algo no Brasil` para `Quero investir no Brasil`; simplificar o ramo de processo para meio de comunicação, valor cobrado e bens em risco; excluir toda oferta de laudo e qualquer corte automático por valor em caso judicial urgente.

- [ ] **Step 3: Documentar o contrato local de eventos**

Definir `analytics` sem PII e `lead_submission` com `session_id`, `event_id`, `timestamp`, `branch`, `branch_label`, `urgent`, `tags`, `value_range`, `answers`, `utm_source`, `utm_medium`, `utm_campaign`, `consent_version`, `consent_timestamp`, `name`, `whatsapp`, `city`, `state` e `contact_period`. Registrar que o endpoint permanece desativado enquanto a URL n8n não for fornecida.

- [ ] **Step 4: Documentar automações sociais prontas para configuração**

Definir palavras-chave `BANCO`, `DIREITO`, `BLOQUEIO`, `PIX`, `DÍVIDA`, `FINANCIAMENTO` e `RECEBÍVEIS`; escrever acolhimento, fallback, comentário público, DM, follow-up dentro da janela permitida e CTA de TikTok. Todas as mensagens devem direcionar ao formulário sem consultoria e sem URL fictícia.

- [ ] **Step 5: Verificar documentação**

Run: `rg -n "oferta de laudo|Quero comprar algo|Imóvel em atraso|Dívidas no exterior|Golpe falsa central" docs CHECKLIST.md`

Expected: nenhuma ocorrência ativa como requisito da V1; ocorrências históricas devem estar marcadas como substituídas ou fora do escopo.

- [ ] **Step 6: Commit**

```bash
git add docs CHECKLIST.md
git commit -m "docs: consolidate first phase requirements"
```

### Task 2: Fixar o visual Sculpted e a estrutura aprovada

**Files:**
- Modify: `index.html`
- Modify: `themes.css`
- Modify: `style.css`
- Modify: `theme-switcher.js`
- Modify: `tests/theme-switcher.test.js`

**Interfaces:**
- Produces: DOM com tema fixo `sculpted`, opções iniciais verticais, marcadores PF/PJ, título “Resultado apurado”, indicador de urgência e formulário de contato manhã/tarde.
- Consumes: nomes dos ramos consolidados na Task 1.

- [ ] **Step 1: Escrever testes que falhem para a entrega visual**

Cobrir: único tema `sculpted`; ausência de seletor e query `?visual=`; ausência da palavra visível “quiz”; rótulos PF/PJ; campos e textos “Resultado apurado”, manhã e tarde; ausência de noite; ausência de bloco de laudo.

- [ ] **Step 2: Executar os testes e confirmar falha**

Run: `node --test tests/theme-switcher.test.js`

Expected: FAIL por seletor/temas antigos e textos ainda não consolidados.

- [ ] **Step 3: Implementar a estrutura mínima**

Fixar `data-quiz-theme="sculpted"`; remover o seletor visual do HTML; reduzir `theme-switcher.js` a inicialização idempotente do tema Sculpted; manter as opções iniciais verticais; incluir chips acessíveis `PF`, `PJ` ou `PF/PJ`; substituir textos visíveis de “quiz” por “formulário”; remover markup da oferta de laudo; manter consentimento antes dos campos.

- [ ] **Step 4: Implementar o indicador de urgência**

Criar um componente semântico com trilho, preenchimento vermelho e rótulo, sem percentual ou alegação estatística; respeitar `prefers-reduced-motion`; apresentar linguagem “Seu prazo pode já estar correndo” somente quando `state.urgent` for verdadeiro, sem garantia de resultado.

- [ ] **Step 5: Executar testes e validação sintática**

Run: `node --test tests/theme-switcher.test.js && node --check theme-switcher.js`

Expected: PASS, 0 falhas.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css themes.css theme-switcher.js tests/theme-switcher.test.js
git commit -m "feat: ship sculpted quiz presentation"
```

### Task 3: Implementar as regras de triagem aprovadas

**Files:**
- Modify: `quiz-flow.js`
- Modify: `tests/flow.test.js`

**Interfaces:**
- Consumes: IDs e rótulos do DOM produzidos na Task 2.
- Produces: `FLOW`, `applyRules`, `finishBranch`, payloads locais e devolutivas compatíveis com a especificação consolidada.

- [ ] **Step 1: Escrever testes de regressão que falhem**

Cobrir: processo com meio de comunicação/valor/bens; múltiplos bens selecionáveis; urgência não dispensada por valor; bloqueio fiscal/trabalhista fora do bancário; financiamento em dia mas insustentável; nomenclaturas novas; exterior com “investir”; apenas falsa central com PIX permanece no escopo; ausência de `oferta_laudo`; manhã/tarde; consentimento versionado e UTMs minimizadas.

- [ ] **Step 2: Executar os testes e confirmar falha**

Run: `node --test tests/flow.test.js`

Expected: FAIL nas regras antigas de processo, imóvel, golpe, exterior e laudo.

- [ ] **Step 3: Atualizar o fluxo e a qualificação**

Implementar as novas perguntas; permitir seleção múltipla apenas em bens sob risco; considerar todo ramo de processo urgente e encaminhá-lo independentemente da faixa; manter “Não sei” para análise; dispensar origem fiscal/trabalhista e golpes fora da falsa central PIX com orientação e sem contato; remover todos os cortes automáticos apenas por valor e remover `oferta_laudo`, `laudo` e `laudo_fechar` das decisões executáveis.

- [ ] **Step 4: Atualizar devolutivas e payload**

Usar “Resultado apurado”; diferenciar urgência; coletar manhã/tarde; gerar `event_id`; capturar apenas hostname do referrer; capturar `utm_source`, `utm_medium`, `utm_campaign`; registrar versão/timestamp do consentimento; não enviar evento se a URL ainda for placeholder; nunca incluir PII em analytics.

- [ ] **Step 5: Executar testes e validação sintática**

Run: `node --test tests/flow.test.js && node --check quiz-flow.js`

Expected: PASS, 0 falhas.

- [ ] **Step 6: Commit**

```bash
git add quiz-flow.js tests/flow.test.js
git commit -m "feat: align triage with client decisions"
```

### Task 4: Tornar o workflow n8n seguro enquanto está em standby

**Files:**
- Modify: `n8n_workflow.json`
- Create: `tests/n8n-workflow.test.js`

**Interfaces:**
- Consumes: contrato de `docs/event-contract.md`.
- Produces: artefato importável, inativo e sem chamadas de CRM/Sheets até receber configuração explícita.

- [ ] **Step 1: Escrever testes que falhem para o workflow**

Validar JSON; exigir `active: false`; exigir que todos os nós externos de escrita estejam desabilitados; proibir fallback de URL/token PipeZ; exigir que o Switch use `event_type`; exigir ausência de segredo real; verificar mapeamento canônico documentado.

- [ ] **Step 2: Executar o teste e confirmar falha**

Run: `node --test tests/n8n-workflow.test.js`

Expected: FAIL porque o CRM está conectado e os nós externos não estão explicitamente desabilitados.

- [ ] **Step 3: Neutralizar integrações adiadas**

Definir `active: false`; desabilitar Google Sheets e PipeZ; remover URL e token fallback de PipeZ; manter somente referências a variáveis sem valor; corrigir nomes dos campos para o contrato canônico; documentar no nome/notas do workflow que é um template inativo.

- [ ] **Step 4: Executar os testes do workflow**

Run: `node --test tests/n8n-workflow.test.js`

Expected: PASS, 0 falhas.

- [ ] **Step 5: Commit**

```bash
git add n8n_workflow.json tests/n8n-workflow.test.js
git commit -m "chore: secure deferred n8n workflow"
```

### Task 5: QA final e atualização do checklist

**Files:**
- Modify: `CHECKLIST.md`
- Modify: `docs/README.md`

**Interfaces:**
- Consumes: entregas e evidências das Tasks 1–4.
- Produces: estado final auditável, separando concluído, bloqueado e adiado.

- [ ] **Step 1: Executar a suíte completa**

Run: `node --test tests/*.test.js`

Expected: PASS, 0 falhas.

- [ ] **Step 2: Executar gates estáticos e de segurança**

Run: `node --check quiz-flow.js && node --check theme-switcher.js && node -e "JSON.parse(require('fs').readFileSync('n8n_workflow.json','utf8'))" && git diff --check`

Expected: exit 0; nenhum segredo ou erro de whitespace.

- [ ] **Step 3: Verificar termos removidos e credenciais**

Run: scan tracked text files for generic JWT, bot-token and credential-assignment patterns, plus the retired `oferta_laudo` and `laudo_fechar` identifiers, without recording any real credential fragment in the command or documentation.

Expected: nenhuma credencial; termos antigos apenas em histórico explicitamente marcado, nunca no código executável.

- [ ] **Step 4: Atualizar o checklist com evidência real**

Marcar apenas tarefas comprovadas pelos testes. Manter bloqueados: ManyChat com token 401, conexão OAuth do Instagram, TikTok sem acesso, n8n sem URL/chave apropriada, confirmação do WhatsApp, dados institucionais, publicação/deploy e entregas que dependam da cliente. Manter adiados: CRM, GA4/GTM, domínio e laudo.

- [ ] **Step 5: Commit**

```bash
git add CHECKLIST.md docs/README.md
git commit -m "docs: record first phase delivery evidence"
```
