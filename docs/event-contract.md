# Contrato local de eventos

Status: contrato canônico para as próximas tarefas. O envio externo permanece desativado até que a URL base do n8n seja fornecida e validada.

## Princípios

- Os eventos usam JSON UTF-8 e um campo `event_type` para distinguir `analytics` de `lead_submission`.
- `analytics` nunca contém PII. Não incluir nome, WhatsApp, cidade, estado, respostas textuais livres ou qualquer documento.
- `lead_submission` só acontece depois da devolutiva, do consentimento e da coleta autorizada de contato.
- Valores, faixas, etiquetas e respostas servem para triagem; não representam promessa de contratação, resultado, desconto ou prazo de solução.
- Enquanto a URL do n8n não estiver configurada, o endpoint não é chamado. O formulário continua podendo encaminhar o caso pelo canal humano aprovado.

## Envelope comum

Todo evento local pode usar:

```json
{
  "event_type": "analytics",
  "session_id": "sessao-local-nao-identificavel",
  "event_id": "uuid-gerado-no-cliente",
  "timestamp": "2026-10-11T12:00:00.000Z"
}
```

`session_id`, `event_id` e `timestamp` são identificadores técnicos. Nunca usar nome, telefone, e-mail, CPF, documento ou outro identificador pessoal para preenchê-los.

## Evento `analytics`

O evento registra navegação e atribuição sem PII. Campos permitidos:

| Campo | Tipo | Regra |
|---|---|---|
| `event_type` | string | Valor exato `analytics`. |
| `session_id` | string | Identificador técnico da sessão; não derivado de PII. |
| `event_id` | string | Identificador único do evento. |
| `timestamp` | string | Data/hora ISO 8601 em UTC. |
| `branch` | string ou `null` | Identificador técnico do ramo, quando já conhecido. |
| `branch_label` | string ou `null` | Nome público do ramo, sem relato livre. |
| `urgent` | boolean | Indica a regra de urgência apurada até a etapa. |
| `tags` | array de strings | Etiquetas de triagem sem dados pessoais. |
| `value_range` | string ou `null` | Faixa declarada, sem transformar a faixa em corte automático. |
| `utm_source` | string ou `null` | Atribuição limitada ao parâmetro UTM. |
| `utm_medium` | string ou `null` | Atribuição limitada ao parâmetro UTM. |
| `utm_campaign` | string ou `null` | Atribuição limitada ao parâmetro UTM. |

`answers` não é enviado no evento `analytics`, pois respostas podem conter relato pessoal. Se a etapa precisar ser auditada, usar apenas uma etiqueta técnica sem conteúdo livre.

## Evento `lead_submission`

O evento é permitido somente após a mensagem de consentimento LGPD e a devolutiva. O payload canônico contém os campos abaixo:

| Campo | Tipo | Regra |
|---|---|---|
| `event_type` | string | Valor exato `lead_submission`. |
| `session_id` | string | O mesmo identificador técnico da sessão. |
| `event_id` | string | Identificador único do envio. |
| `timestamp` | string | Data/hora ISO 8601 em UTC. |
| `branch` | string | Identificador canônico do ramo. |
| `branch_label` | string | Nome público consolidado do ramo. |
| `urgent` | boolean | Urgência apurada pelo fluxo. |
| `tags` | array de strings | Etiquetas de triagem aplicadas. |
| `value_range` | string ou `null` | Faixa informada, somente para contexto/priorização. |
| `answers` | objeto | Respostas estruturadas do fluxo; não incluir documentos nem dados além do necessário. |
| `utm_source` | string ou `null` | Parâmetro UTM, quando presente. |
| `utm_medium` | string ou `null` | Parâmetro UTM, quando presente. |
| `utm_campaign` | string ou `null` | Parâmetro UTM, quando presente. |
| `consent_version` | string | Versão do texto de consentimento exibido. |
| `consent_timestamp` | string | Data/hora ISO 8601 em UTC do consentimento. |
| `channel` | string | Discriminador do canal: `web_form` para este formulário ou `manychat_native` para um futuro lead nativo do ManyChat. |
| `channel_user_id` | string ou `null` | Obrigatório em `manychat_native`; deve ser `null` ou omitido em `web_form`. |
| `name` | string | Nome informado pelo titular após o consentimento. |
| `whatsapp` | string ou `null` | Obrigatório e não nulo em `web_form`. Só pode ser `null` em `manychat_native` quando `channel_user_id` estiver presente e o consentimento autorizar contato nesse canal. |
| `city` | string | Cidade informada pelo titular. |
| `state` | string | Estado informado pelo titular. |
| `contact_period` | string | Preferência de contato permitida pelo fluxo. |

O payload não deve conter token, chave de API, ID privado de planilha, documento jurídico, senha ou dados reais usados como exemplo.

### Contrato discriminado por canal

O evento `lead_submission` usa `channel` como discriminador:

- `channel: "web_form"`: variante vigente. `whatsapp` é obrigatório após o consentimento; `channel_user_id` deve ser `null` ou não ser enviado. O formulário web não pode dispensar o WhatsApp por identificar a origem do acesso.
- `channel: "manychat_native"`: variante futura e ainda não ativada. `channel_user_id` é obrigatório. `whatsapp` pode ser `null` somente quando esse identificador existir e o consentimento autorizar contato pelo canal ManyChat; caso contrário, o WhatsApp continua obrigatório.

Assim, não existe uma regra geral de “pular o WhatsApp”: a exceção depende simultaneamente do canal nativo, do identificador do usuário e do consentimento compatível.

## Endpoint e estado de ativação

- Endpoint n8n: pendente de URL base válida e da configuração segura de `X-N8N-API-KEY`.
- Estado atual: desativado/standby; não considerar o webhook concluído nem substituir o encaminhamento humano.
- O workflow só poderá ser ativado depois de configurar a URL real, a chave por variável segura e os destinos aprovados.
- URLs fictícias, tokens em código e fallbacks que aparentem funcionar não são permitidos.

## Rastreabilidade

Os nomes canônicos de `branch` são: `processo`, `empresa`, `bloqueio`, `recebiveis`, `avalista`, `imovel`, `servidor`, `golpe`, `exterior` e `outro`. Os rótulos públicos correspondentes ficam na especificação ManyChat.
