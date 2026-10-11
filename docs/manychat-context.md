# Contexto do ManyChat

## Objetivo

Construir uma entrada automatizada para Instagram, WhatsApp e, quando suportado e autorizado, TikTok. A automação encaminha pessoas para uma triagem curta de Direito Bancário, sem substituir o atendimento jurídico.

O bot coleta contexto, aplica somente filtros confirmados, entrega orientação inicial sem promessa de resultado e encaminha os casos adequados para atendimento humano. Uma pergunta deve ser apresentada por mensagem; respostas fechadas usam botões e texto livre fica restrito a “Meu caso é outro”.

## Fonte de verdade consolidada

- Visual aprovado para o formulário: `Sculpted Bordeaux`.
- Laudo removido da V1: não há oferta, preço, caminho de contratação ou coleta de contato associada a laudo.
- CRM, GA4/GTM e domínio permanecem adiados até que acessos e definições estejam disponíveis.
- A conta ManyChat não é auditável enquanto o token disponível retornar HTTP 401.
- O n8n não é auditável nem ativável sem URL base e chave `X-N8N-API-KEY` fornecidas com segurança.
- Faixas de valor são contexto/priorização; não há corte automático por valor sem decisão comercial confirmada.
- “Não sei” não elimina automaticamente o lead.
- A devolutiva vem antes da captura de contato. Casos dispensados recebem orientação útil e a opção de refazer as perguntas, sem coleta de contato.

## Relação com o formulário

O projeto possui um formulário web standalone. Ele implementa a triagem detalhada, registra eventos locais conforme `docs/event-contract.md` e pode encaminhar o caso ao canal humano aprovado. O endpoint n8n continua desativado enquanto a URL base não for fornecida.

O ManyChat é a camada de aquisição e triagem social. As duas superfícies usam os mesmos ramos e categorias:

| Ramo técnico | Rótulo público | Público de referência |
|---|---|---|
| `processo` | Banco me processou | PF/PJ |
| `empresa` | Empresa endividada | PJ |
| `bloqueio` | Conta bloqueada | PF/PJ |
| `recebiveis` | Recebíveis retidos | PJ |
| `avalista` | Sócio ou avalista | PF/PJ |
| `imovel` | Financiamento imobiliário | PF/PJ |
| `servidor` | Servidor de carreira | PF |
| `golpe` | Golpe PIX de falsa central | PF |
| `exterior` | Residente no exterior | PF |
| `outro` | Meu caso é outro | PF/PJ |

Uma alteração em uma superfície não atualiza automaticamente a outra; qualquer mudança deve atualizar a especificação e o contrato de eventos.

## Entradas sociais

As automações podem começar por comentário, mensagem direta, palavra-chave, novo seguidor quando o canal permitir ou link rastreado. As mensagens operacionais, palavras-chave e condições ficam em `docs/social-automation-spec.md`.

Todas as mensagens direcionam para o formulário pelo link oficial do canal. Não inserir URL fictícia, não pedir documentos em comentários e não prestar consultoria por DM.

## Integrações e estado

- ManyChat: configuração e auditoria bloqueadas pelo retorno HTTP 401 do token disponível.
- Formulário web: fonte executável da triagem; visual aprovado `Sculpted Bordeaux`.
- n8n: contrato local em `docs/event-contract.md`; endpoint desativado até existir URL base e `X-N8N-API-KEY` segura.
- Google Sheets: dependência de analytics/contingência adiada com GA4/GTM; não é ferramenta operacional diária.
- CRM: adiado; não há integração nem ID para versionar.
- WhatsApp comercial: o número atualmente presente no frontend permanece pendente de confirmação e não é tratado como definitivo neste documento.
- Domínio e deploy público: adiados até configuração e validação.

## Dados e segurança

O fluxo pode usar ramo, urgência, etiquetas, faixa de valor, respostas estruturadas, UTMs e dados de contato somente após consentimento. Analytics não contém PII. Não versionar tokens, credenciais, IDs privados, documentos jurídicos ou dados reais de leads.

O consentimento obrigatório é exibido antes da captura:

> Ao enviar seus dados, você autoriza o nosso contato por WhatsApp ou telefone. Suas informações são tratadas com sigilo, conforme a LGPD.

## Pendências que continuam pendentes

- Acessos válidos à conta ManyChat, Instagram e TikTok.
- URL base e chave segura do n8n.
- Decisão e acesso ao CRM.
- Configuração de GA4/GTM, domínio e publicação.
- Confirmação do número comercial, horários de contato e dados institucionais.

Nenhum item pendente deve ser transformado em requisito automático ou marcado como concluído sem evidência.
