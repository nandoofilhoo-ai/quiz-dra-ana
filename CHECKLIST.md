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

- [!] Conta ManyChat não auditável/configurável enquanto o token disponibilizado retornar HTTP 401. A API pública também não cria gatilhos ou fluxos visuais do Instagram; a configuração depende da interface e de acesso administrativo válido.
- [x] `n8n_workflow.json` revisado como template local inativo: nós de escrita desabilitados, incluindo o nó CRM, sem endpoint ou token literal.
- [!] n8n remoto não ativável sem URL base, chave de API pública com escopo necessário, URL final do webhook e destino aprovado para os dados.
- [~] CRM adiado; não versionar tokens, credenciais, IDs privados ou placeholders que aparentem integração ativa.
- [~] GA4/GTM adiados; a telemetria futura deve seguir o contrato local sem PII.
- [~] Domínio, deploy público e link oficial do formulário adiados.
- [!] TikTok não configurado: acesso e permissões do canal ainda não foram disponibilizados.
- [ ] Confirmar o número comercial antes de tratá-lo como definitivo ou publicar alterações.
- [ ] Confirmar horários de contato e dados institucionais antes de exibi-los.

## Frontend e triagem executável

- [x] Aplicação standalone em `index.html`, `style.css` e `quiz-flow.js`.
- [x] Fluxo inicial preserva `Conta bloqueada` e `Recebíveis retidos` como entradas separadas.
- [x] Visual `Sculpted Bordeaux` fixado como padrão; seletor de apresentação removido.
- [x] Opções iniciais em lista vertical com marcadores de público `PF`/`PJ`.
- [x] Referências visíveis substituídas por “formulário”.
- [x] Tela “Resultado apurado”, indicador qualitativo de urgência e texto de cautela para prazo implementados.
- [x] Preferência de contato limitada a manhã ou tarde.
- [x] Regras consolidadas de triagem implementadas e cobertas por testes: processo, bloqueio, financiamento, golpe PIX, exterior, consentimento e dispensas confirmadas.
- [-] Reconciliar as demais etapas do formulário com `docs/manychat-flow-spec.md`; não considerar toda a especificação implementada até essa conferência ponta a ponta.
- [x] Caminhos executáveis de laudo removidos; dispensas confirmadas não coletam contato.
- [x] Consentimento versionado e UTMs minimizadas implementados conforme `docs/event-contract.md`.

## n8n e telemetria

- [x] Workflow contém o esqueleto de webhook e roteamento para referência local.
- [x] Workflow mantido inativo e sem escritas externas; a ativação depende da configuração segura do n8n remoto.
- [x] Eventos locais sem PII e fallback de encaminhamento humano com endpoint desativado validados por testes.

## QA e entrega

- [x] Testes do fluxo e da apresentação registrados no repositório.
- [x] Testes atualizados para nomenclaturas, urgência, exterior, financiamento e ausência de laudo.
- [x] Suíte automatizada, validação sintática e checagem de diff executadas nesta fase.
- [x] Comportamento de casos dispensados sem captura de contato validado por testes.
- [x] Validação visual responsiva em 390 × 844 e desktop concluída; textos permanecem legíveis, sem clipping ou rolagem horizontal.
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
| 2026-10-11 | Aprovação visual da cliente | Concluído | A cliente escolheu `Sculpted Bordeaux`; o visual foi fixado no formulário e o seletor removido. |
| 2026-10-11 | Consolidação da reunião de 09/10 | Concluído | Nomenclaturas, urgência, laudo, integrações e automações sociais consolidados sem inventar pendências comerciais. |
| 2026-10-11 | Contratos da primeira fase | Concluído | `docs/event-contract.md` e `docs/social-automation-spec.md` criados; integrações externas permanecem adiadas/bloqueadas. |
| 2026-10-11 | Fechamento documental e QA automatizado | Concluído | Regras consolidadas, responsividade e template n8n validados localmente; ManyChat, TikTok, deploy e integrações remotas permanecem pendentes. |
