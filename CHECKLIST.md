# Checklist do Projeto — Standalone Vercel

Arquivo de acompanhamento vivo. Marcaremos um item como concluído somente após validar a entrega correspondente.

**Legenda:** `[ ]` pendente · `[-]` em andamento · `[x]` concluído · `[!]` bloqueado · `[~]` adiado/fora do escopo atual

## Escopo da primeira fase

- [x] Manter o laudo fora da primeira versão do formulário.
- [~] Deixar CRM, GA4/GTM e configuração do domínio em standby; serão retomados quando os acessos e definições estiverem disponíveis.
- [-] Priorizar frontend do formulário, regras de triagem, ManyChat/Instagram/TikTok e QA funcional.

## 1. Setup de infraestrutura, dados e analytics (GA4 + GTM)

- [x] Criar a planilha de controle no Google Sheets
  - [x] Criar a aba `Analytics_Funil` com as colunas: Timestamp, Session_ID, Etapa_Alcancada, UTM_Source, UTM_Medium, UTM_Campaign.
  - [x] Criar a aba `Leads_Qualificados` com as colunas: Data, Nome, WhatsApp, Problema, Faixa_Valor, Session_ID, Status.
- [~] Configurar Google Tag Manager (GTM) e GA4 — adiado para fase posterior.
  - [~] Criar propriedade no GA4 e container Web no GTM.
  - [~] Instalar as tags do GTM (head e body) no código-fonte do quiz na Vercel.
  - [~] Configurar acionadores e tags de evento customizado no GTM para os eventos do `dataLayer`: `quiz_step_view`, `quiz_qualified` e `quiz_disqualified`.
- [-] Alinhar dados com a cliente
  - [-] Configurar número oficial do WhatsApp comercial para recepção dos leads qualificados. Número `5524992331416` já está configurado no frontend; falta confirmar que é o número oficial definitivo.
  - [~] Obter acessos ao PipeZ e ao ADV Box — standby enquanto os acessos são providenciados.
  - [~] Auditar primeiro o CRM e a API do ADV Box, priorizando centralizar a operação no ecossistema já contratado pela cliente.
  - [~] Comparar ADV Box e PipeZ e definir a arquitetura final. Usar PipeZ apenas se o ADV Box não atender à entrada automatizada e à gestão do pipeline.

## 2. Desenvolvimento frontend e deploy (Vercel Standalone)

- [x] Estruturar a aplicação web (HTML/CSS/JS)
  - [x] Desenvolver `index.html` com layout de cards em página única (micro-app nativo, sem iframe).
  - [x] Estilizar `style.css` com a identidade de alta conversão, cards e responsividade mobile. A paleta implementada está em bordô/dourado, não verde/dourado.
  - [x] Criar seletor de apresentação com seis propostas visuais premium em bordô, dourado, branco e cinza, sem duplicar ou alterar o fluxo de triagem.
  - [x] Visual aprovado pela cliente: `Sculpted Bordeaux`.
  - [ ] Tornar `Sculpted Bordeaux` o visual padrão e remover o seletor usado apenas na apresentação.
  - [ ] Manter as opções iniciais em lista vertical e incluir identificação visual de público `PF`/`PJ`.
  - [ ] Substituir referências visíveis a “quiz” por “formulário”, conforme preferência da cliente.
  - [ ] Ajustar a tela de resultado: usar “Resultado apurado”, indicador/termômetro vermelho animado e mensagem explícita de urgência nos casos com prazo, sem sugerir garantia de resultado.
  - [ ] Ajustar preferência de contato para manhã ou tarde e confirmar os horários efetivamente disponíveis para agendamento.
  - [ ] Revisar nomenclaturas da entrada: `Financiamento imobiliário`, `Golpe PIX de falsa central` e `Residente no exterior`.
  - [ ] No ramo exterior, substituir a opção “Quero comprar algo no Brasil” por “Quero investir no Brasil”.
  - [x] Manter `Conta bloqueada` e `Recebíveis retidos` como entradas separadas; a distinção ajuda a qualificar PF e empresário.
  - [-] Criar no `script.js` a lógica de captura de parâmetros UTM da URL e armazenamento das respostas. O arquivo equivalente é `quiz-flow.js`; UTM é lida no envio do lead, mas ainda não há persistência completa dos parâmetros.
  - [-] Revisar as regras de qualificação conforme a reunião de 09/10; a matriz atual não deve ser tratada como definitiva.
    - [ ] Encurtar `Banco me processou` para as informações essenciais: meio da notificação/citação, valor cobrado e bens sujeitos a risco, com seleção múltipla quando necessário.
    - [ ] Tratar oficial de justiça, carta dos Correios e WhatsApp como formas possíveis de comunicação do processo.
    - [ ] Encaminhar rapidamente casos judiciais urgentes ao WhatsApp com mensagem de que o prazo já está correndo.
    - [ ] Não dispensar automaticamente caso judicial urgente apenas pelo valor da dívida; avaliar valor e patrimônio em conjunto.
    - [ ] Manter filtro da origem em `Conta bloqueada`: bancária segue; fiscal ou trabalhista recebe orientação/encaminhamento adequado sem ser tratado como atuação bancária.
    - [ ] Reformular `Financiamento imobiliário` para incluir tanto inadimplentes quanto pessoas ainda adimplentes, mas com parcela insustentável.
    - [x] Decisão comercial: descartar a oferta do laudo na primeira versão do formulário.
    - [ ] Remover/desativar a oferta e os caminhos de laudo no frontend antes da publicação inicial; reavaliar em fase futura.
- [-] Implementar telemetria dupla no JS
  - [ ] Disparar `dataLayer.push({ event: 'quiz_step_view', step: X })` a cada avanço de tela para o GTM. Não encontrado no código atual.
  - [x] Manter o envio via `navigator.sendBeacon` para o n8n no evento de analytics.
  - [x] Configurar redirecionamento direto (`window.location.href`) para o WhatsApp comercial na conclusão do lead qualificado.
- [ ] Fazer deploy na Vercel
  - [ ] Subir o repositório no GitHub/GitLab.
  - [~] O domínio corporativo e o DNS ficam adiados para fase posterior; Bruno está providenciando o domínio.
  - [~] Realizar deploy na Vercel e configurar o subdomínio preferido `forms.anamariamagalhaes.com` — configuração do domínio adiada.
  - [~] Configurar o link público definitivo do formulário para uso na bio, DMs e campanhas — depende do domínio.
  - [~] Configurar link, chamada e destino da oferta de laudo — fora do escopo inicial.
  - [ ] Exibir os dados institucionais confirmados no site, incluindo OAB e CNPJ; validar antes se o endereço fiscal será publicado.

## 3. Construção do backend e automação (n8n)

- [-] Configurar workflow central no n8n
  - [x] Configurar nó Webhook (POST) no path `/webhook/quiz-events` no arquivo `n8n_workflow.json`.
  - [x] Configurar nó Switch baseado no campo `{{ $json.body.event_type }}`.
  - [~] Configurar ramo `analytics`: o nó para a aba `Analytics_Funil` existe, mas a configuração fica adiada junto com GA4/GTM.
  - [~] Replanejar o ramo `lead_submission`: standby enquanto os acessos e a decisão do CRM não estiverem disponíveis.
  - [~] Entregar o lead já criado e classificado no CRM, sem exigir leitura de planilha ou cadastro manual pela cliente.
  - [ ] Manter o Google Sheets como base de analytics, auditoria e contingência, não como ferramenta operacional diária da cliente.
- [~] Conectar variáveis de ambiente — adiado com as integrações de CRM/analytics.
  - [~] Atualizar o JS do frontend na Vercel com a URL definitiva do Webhook do n8n. O frontend ainda usa `https://n8n.seu-dominio.com/webhook/quiz-events`.
- [ ] Automatizar dados e rastreamento do quiz
  - [ ] Definir o payload final de analytics e os nomes oficiais dos eventos.
  - [~] Configurar captura e persistência de `session_id`, etapas alcançadas, desistências e UTMs.
  - [~] Configurar eventos no `dataLayer`: `quiz_step_view`, `quiz_qualified` e `quiz_disqualified`.
  - [~] Configurar tags, acionadores e conversões no GTM/GA4.
  - [~] Validar a gravação dos eventos no Google Sheets via n8n.

## 4. Automações de redes sociais (Instagram e TikTok)

- [ ] Configurar automação no Instagram (ManyChat / n8n IG API)
  - [ ] Configurar comentários com respostas simples e contextuais; evitar resposta genérica que possa reagir inadequadamente a críticas ou ofensas.
  - [ ] Configurar mensagem direta (DM) de acolhimento e encaminhamento ao formulário, sem prestar consultoria gratuita na conversa.
  - [!] Configurar mensagem automática para novos seguidores; depende de login/conexão da cliente no ManyChat.
  - [ ] Configurar resposta automática para mensagens recebidas na DM, sempre direcionando o titular do caso ao formulário.
  - [ ] Ativar automação na DM por palavra-chave.
  - [ ] Definir e cadastrar todas as palavras-chave, respostas, condições e mensagens de fallback.
  - [ ] Configurar sequência de follow-up para quem interagir e não acessar/concluir o quiz.
  - [ ] Padronizar o link enviado nas DMs e no Link da Bio com parâmetros de rastreamento, usando o subdomínio `forms` quando publicado.
- [ ] Configurar automação no TikTok
  - [ ] Inserir o link rastreado do formulário na bio.
  - [ ] Priorizar conteúdo de bloqueio de conta e bloqueio de recebíveis.
  - [ ] Usar respostas em comentários para direcionar à bio/formulário; não priorizar automação por DM no TikTok.
  - [ ] Criar uma tela/encerramento padrão para vídeos com chamada para o formulário e canais de contato.

## 5. Validação, testes integrados (QA) e entrega

- [-] Testar navegação e qualificação
  - [x] Validar regras de navegação, qualificação e devolutivas com testes automatizados: 17 testes passaram (14 do fluxo + 3 do seletor visual).
  - [ ] Atualizar os testes após implementar as novas regras aprovadas na reunião.
  - [~] Simular lead qualificado com CRM, GA4/GTM e planilha — integrações adiadas.
  - [ ] Simular lead não qualificado apenas no comportamento do formulário e na ausência de oferta de laudo.
  - [ ] Medir abandono por etapa e revisar perguntas ambíguas ou excesso de etapas após os primeiros dados reais.
- [ ] Testar origem e atribuição (UTMs)
  - [~] Acessar o formulário pelos links simulados do Instagram e TikTok e confirmar no GA4 e no Google Sheets que `utm_source` foi gravado corretamente — GA4/GTM adiados.
- [ ] Entregar para a cliente
  - [ ] Entregar o acesso à planilha de controle no Google Sheets.
  - [ ] Apresentar o fluxo de funcionamento das automações sociais (Instagram/TikTok) direcionando para a triagem automática.

## Registro de andamento

| Data | Item / decisão | Status | Evidência / observação |
|---|---|---|---|
| 2026-10-06 | Checklist criado na raiz do projeto | Em andamento | Este arquivo será atualizado conforme as entregas forem validadas. |
| 2026-10-06 | Auditoria do frontend | Concluído | `index.html`, `style.css` e `quiz-flow.js` implementam o quiz em cards, responsividade, formulário de lead, qualificação e redirecionamento ao WhatsApp. |
| 2026-10-06 | Testes automatizados do fluxo | Concluído | `node --test tests/flow.test.js`: 14 testes aprovados, 0 falhas. |
| 2026-10-06 | Auditoria do workflow n8n | Em andamento | `n8n_workflow.json` contém Webhook, Switch, Google Sheets e PipeZ; faltam credenciais, IDs definitivos e endpoint real. |
| 2026-10-06 | Auditoria de analytics/GTM | Pendente | Não foram encontrados `dataLayer.push` nem tags/configuração GTM/GA4 no projeto. |
| 2026-10-06 | Pendências adicionais registradas | Pendente | Link e oferta de laudo; automações de dados/rastreamento; automações ManyChat para novos seguidores, DMs, palavras-chave e follow-up. |
| 2026-10-08 | Variações visuais para aprovação | Concluído | Curadoria final com Maison Jurídica, Monochrome Estate, Art Déco Jurídico, Atelier Contemporâneo, Sculpted Bordeaux e Soft Prestige. Soft e Art Déco foram preservados; as outras quatro propostas foram reconstruídas com direção editorial e imagens autorais. Preferência salva e opção compartilhável por `?visual=`. Validação visual realizada em desktop e mobile, incluindo abertura, perguntas e formulário. |
| 2026-10-11 | Aprovação visual da cliente | Concluído | A cliente escolheu a proposta `Sculpted Bordeaux`. A eventual remoção do seletor e definição do tema como padrão aguardam a consolidação das demais solicitações da reunião. |
| 2026-10-11 | Consolidação da reunião de 09/10 | Concluído | Gravação “Alinhamento de Quiz, CRM e Operação de Leads” consultada via API do Fireflies. Registrados ajustes de fluxo, urgência, nomenclaturas, CRM, laudo, domínio e automações sociais. Decisões não fechadas permaneceram pendentes. |
| 2026-10-11 | Priorização da primeira fase | Concluído | Cliente decidiu descartar inicialmente o laudo e deixar CRM, GA4/GTM e domínio em standby. O foco atual passa a ser frontend do formulário, regras de triagem, ManyChat/Instagram/TikTok e QA funcional. |
