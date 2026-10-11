# Contexto do ManyChat

## Objetivo

Construir uma entrada automatizada para Instagram, WhatsApp e, quando suportado pela ferramenta escolhida, TikTok. A automação transforma comentários, mensagens diretas e acessos sociais em uma triagem curta de Direito Bancário, filtrando casos fora do perfil antes de consumir tempo da equipe.

O ManyChat não substitui o atendimento jurídico. Ele coleta contexto, aplica filtros previamente aprovados, entrega orientação inicial sem promessa de resultado e encaminha os casos adequados para um advogado.

## Relação com o quiz web

O projeto possui um quiz web standalone na Vercel. Ele implementa uma versão detalhada da triagem, recebe respostas, qualifica o lead e pode redirecionar para o WhatsApp.

O ManyChat é a camada de aquisição e triagem social. As duas superfícies precisam usar os mesmos nomes de ramos, critérios e categorias, mas uma alteração em uma superfície não atualiza automaticamente a outra.

## Entradas previstas

- comentário em post ou Reel com palavras-chave como `DIREITO`, `GOLPE` ou `BANCO`;
- mensagem direta recebida;
- palavra-chave enviada na DM;
- novo seguidor, quando o canal e a conta permitirem;
- link social rastreado para o quiz web.

Palavras-chave, fallbacks e follow-ups ainda precisam ser cadastrados e validados na conta ManyChat.

## Saída esperada

1. Identificar o ramo do caso.
2. Guardar respostas e classificação.
3. Marcar urgência quando aplicável.
4. Oferecer laudo ou dispensar conforme a regra aprovada.
5. Coletar contato somente quando houver continuidade.
6. Registrar origem, campanha e ponto de entrada.
7. Encaminhar o lead ao atendimento humano.

## Dados mínimos para o atendimento

- ramo e etiqueta base;
- urgência;
- pessoa física ou empresa;
- faixa de valor ou prejuízo;
- respostas do ramo;
- nome, WhatsApp, cidade, estado e melhor horário;
- origem, campanha, post, Reel ou palavra-chave;
- documentos recomendados para a análise inicial.

## Integrações previstas

- ManyChat: conversa, campos, etiquetas e disparo do fluxo;
- quiz web: triagem detalhada e captura de leads;
- n8n: webhook `/webhook/quiz-events`;
- Google Sheets: `Analytics_Funil` e `Leads_Qualificados`;
- PipeZ: CRM de leads qualificados;
- WhatsApp comercial: atualmente `5524992331416`.

O workflow n8n já contém Webhook, Switch, Google Sheets e HTTP Request para PipeZ, mas ainda possui placeholders de credenciais, planilha, token e endpoint.

## Estado atual

Implementado ou parcialmente implementado:

- quiz web em HTML, CSS e JavaScript;
- regras de navegação e qualificação cobertas por 14 testes aprovados;
- redirecionamento para WhatsApp ao concluir lead qualificado;
- esqueleto do workflow n8n;
- definição dos nove ramos do ManyChat.

Pendente:

- configuração real da conta ManyChat;
- palavras-chave, gatilhos, fallbacks e follow-ups;
- preço do laudo;
- prazo real de retorno;
- estados e cidades atendidos;
- critérios finais de dispensa;
- credenciais e IDs do Google Sheets;
- endpoint e token do PipeZ;
- GTM, GA4 e eventos `dataLayer`;
- deploy e domínio definitivo do quiz.

## Cuidados

- Confirmar limites de caracteres e tipos de botão por canal.
- Manter uma pergunta por mensagem e linguagem simples.
- Não prometer êxito, economia, prazo de solução ou resultado judicial.
- Não transformar item pendente em regra automática sem confirmação.

