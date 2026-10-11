# Checklist do Projeto — Standalone Vercel

Arquivo de acompanhamento vivo. Um item só é marcado como concluído quando existe evidência correspondente.

**Legenda:** `[ ]` pendente · `[-]` em andamento · `[x]` concluído · `[!]` bloqueado · `[~]` adiado/fora do escopo atual

## Fonte de verdade da primeira fase

- [x] Visual aprovado: `Sculpted Bordeaux`.
- [x] Laudo fora da V1: sem oferta, preço, caminho de contratação ou coleta associada.
- [~] CRM, GA4/GTM e domínio em standby até que acessos e definições estejam disponíveis.
- [x] Nomenclaturas consolidadas no fluxo: `Financiamento imobiliário`, `Golpe PIX de falsa central`, `Residente no exterior` e `Quero investir no Brasil`.
- [x] Ramo de processo reduzido a meio de comunicação, valor cobrado e bens em risco; bens permitem seleção múltipla.
- [x] Todo caso de `Banco me processou` é sinalizado como urgente; valor não produz dispensa automática.
- [x] Origem fiscal ou trabalhista em `Conta bloqueada` recebe orientação fora do bancário, sem captura de contato.
- [x] “Não sei” segue para análise quando não houver regra específica.

## Contratos e documentação

- [x] Contrato canônico de eventos documentado em `docs/event-contract.md`.
  - [x] `analytics` sem PII.
  - [x] `lead_submission` com os campos canônicos, consentimento e dados de contato após a devolutiva.
  - [x] Endpoint n8n explicitamente desativado enquanto não houver URL base e chave `X-N8N-API-KEY` segura.
- [x] Roteiro de automações sociais documentado em `docs/social-automation-spec.md`.
  - [x] Palavras-chave, acolhimento, fallback, comentário público, DM, follow-up condicionado à janela do canal e CTA de TikTok.
  - [x] Mensagens sem consultoria, promessa ou URL fictícia.

## Auditoria e integrações externas

- [!] Conta ManyChat não auditável enquanto o token disponível retornar HTTP 401.
- [!] n8n não auditável/ativável sem URL base e chave `X-N8N-API-KEY` fornecidas com segurança.
- [~] CRM adiado; não versionar tokens, credenciais, IDs privados ou placeholders que aparentem integração ativa.
- [~] GA4/GTM adiados; a telemetria futura deve seguir o contrato local sem PII.
- [~] Domínio, deploy público e link oficial do formulário adiados.
- [ ] Confirmar o número comercial antes de tratá-lo como definitivo ou publicar alterações.
- [ ] Confirmar horários de contato e dados institucionais antes de exibi-los.

## Frontend e triagem executável

- [x] Aplicação standalone em `index.html`, `style.css` e `quiz-flow.js`.
- [x] Fluxo inicial preserva `Conta bloqueada` e `Recebíveis retidos` como entradas separadas.
- [ ] Fixar o visual `Sculpted Bordeaux` como padrão e remover o seletor de apresentação.
- [ ] Manter opções iniciais em lista vertical e marcadores de público `PF`/`PJ`.
- [ ] Substituir referências visíveis a “quiz” por “formulário”.
- [ ] Implementar tela “Resultado apurado”, indicador qualitativo de urgência e texto de cautela para prazo.
- [ ] Ajustar preferência de contato para manhã ou tarde.
- [ ] Implementar as regras consolidadas em `docs/manychat-flow-spec.md`.
- [ ] Remover qualquer caminho executável de laudo e confirmar que dispensas não coletam contato.
- [ ] Capturar consentimento versionado e UTMs minimizadas conforme `docs/event-contract.md`.

## n8n e telemetria

- [x] Workflow contém o esqueleto de webhook e roteamento para referência local.
- [ ] Manter o workflow inativo e sem escritas externas até a Task 4 validar a configuração segura.
- [ ] Validar eventos locais sem PII e o fallback de encaminhamento humano quando o endpoint estiver desativado.

## QA e entrega

- [x] Testes existentes do fluxo e do seletor visual registrados no repositório.
- [ ] Atualizar testes para nomenclaturas, urgência, exterior, financiamento e ausência de laudo.
- [ ] Executar suíte completa, validação sintática e `git diff --check` após as Tasks 2–4.
- [ ] Validar o comportamento de casos dispensados sem captura de contato.
- [ ] Entregar configuração das automações sociais somente depois dos acessos e permissões da cliente.

## Nomenclaturas históricas substituídas

Os termos abaixo só podem aparecer em histórico ou auditoria; não são requisitos ativos da V1:

| Termo histórico | Estado |
|---|---|
| `oferta de laudo` | fora da V1; substituído por triagem e encaminhamento humano |
| `Quero comprar algo no Brasil` | substituído por `Quero investir no Brasil` |
| `Imóvel em atraso` | substituído por `Financiamento imobiliário` |
| `Dívidas no exterior` | substituído por `Residente no exterior` |
| `Golpe falsa central` | substituído por `Golpe PIX de falsa central` |

## Registro de andamento

| Data | Item / decisão | Status | Evidência / observação |
|---|---|---|---|
| 2026-10-06 | Checklist criado na raiz do projeto | Concluído | Estado inicial do projeto registrado. |
| 2026-10-08 | Variações visuais para aprovação | Concluído | Curadoria visual preservada; a aprovação final foi registrada abaixo. |
| 2026-10-11 | Aprovação visual da cliente | Concluído | A cliente escolheu `Sculpted Bordeaux`; remoção do seletor continua na fila de frontend. |
| 2026-10-11 | Consolidação da reunião de 09/10 | Concluído | Nomenclaturas, urgência, laudo, integrações e automações sociais consolidados sem inventar pendências comerciais. |
| 2026-10-11 | Contratos da primeira fase | Concluído | `docs/event-contract.md` e `docs/social-automation-spec.md` criados; integrações externas permanecem adiadas/bloqueadas. |
