# Especificação de automações sociais

Status: pronta para configuração, ainda não ativada. A conta ManyChat não é auditável enquanto o token disponível retornar HTTP 401. O formulário deve ser apontado somente pelo link oficial configurado pela equipe; este documento não inventa URL.

## Objetivo e limites

Instagram e TikTok fazem acolhimento e encaminhamento para o formulário de triagem. Todas as mensagens são sem consultoria: não analisar documentos por mensagem, não prometer resultado, desconto, contratação, prazo de solução ou retorno.

O formulário é a etapa de triagem. O contato só deve ser solicitado depois da devolutiva e do consentimento. Se o caso for dispensado, não coletar contato: oferecer orientação geral segura e a opção de refazer as perguntas.

## Palavras-chave

Cadastrar, preservando acentos, as palavras-chave:

`BANCO` · `DIREITO` · `BLOQUEIO` · `PIX` · `DÍVIDA` · `FINANCIAMENTO` · `RECEBÍVEIS`

As palavras podem ser reconhecidas sem diferenciar maiúsculas e minúsculas, mas não devem disparar respostas para insultos, reclamações genéricas ou assuntos fora do contexto. O fallback deve assumir dúvida, não qualificar o caso automaticamente.

## Mensagens operacionais

### Acolhimento por palavra-chave ou DM

> Olá! Este é o atendimento inicial da Dra. Ana Magalhães em Direito Bancário. Para entender o seu caso, responda ao formulário de triagem pelo link oficial deste canal. Ele organiza as informações para a análise inicial; não é uma consulta jurídica e não promete resultado.

CTA: `Abrir formulário` — apontar para o link oficial configurado no canal.

### Fallback

> Posso encaminhar você para o formulário de triagem de Direito Bancário. Use o link oficial deste canal e escolha a situação mais urgente. Se o assunto não for bancário, o formulário indicará o próximo passo possível.

CTA: `Abrir formulário` — apontar para o link oficial configurado no canal.

### Comentário público

> Enviamos o caminho para o formulário de triagem pelo canal oficial. Acesse o link da bio para responder com segurança; não publique dados pessoais ou documentos nos comentários.

Não pedir nome, telefone, CPF, número de processo ou documento em público. Não discutir o mérito do caso no comentário.

### DM após comentário ou interação

> Obrigado por chamar. Para preservar sua privacidade, não envie documentos ou detalhes do caso por aqui. Responda ao formulário pelo link oficial deste canal; depois da devolutiva, o fluxo informa se há encaminhamento para atendimento humano.

CTA: `Abrir formulário` — apontar para o link oficial configurado no canal.

### Follow-up

Enviar apenas enquanto a janela de mensagens permitida pelo canal estiver aberta e somente para quem iniciou uma interação válida. Não inventar prazo de resposta nem insistir fora da janela.

> Você iniciou a triagem, mas ela ainda não foi concluída. Se quiser continuar, acesse o formulário pelo link oficial deste canal. Não envie documentos ou dados pessoais nesta mensagem.

Se a janela estiver fechada, não disparar a mensagem. Não coletar contato no follow-up e não prometer retorno.

### CTA para TikTok

Texto para bio, encerramento de vídeo ou comentário:

> Tem dúvida sobre banco, bloqueio, PIX, financiamento ou recebíveis? Acesse o formulário de triagem pelo link oficial da bio. Responda às perguntas e receba uma orientação inicial; não envie documentos nos comentários.

CTA curto: `Faça a triagem no link da bio.`

No TikTok, priorizar comentário e bio. Não criar automação de DM sem acesso e validação do canal.

## Roteamento inicial

| Palavra-chave | Direção inicial |
|---|---|
| `BANCO` | Formulário; ramo mais urgente escolhido pela pessoa. |
| `DIREITO` | Formulário; sem assumir que o caso é bancário. |
| `BLOQUEIO` | Formulário; orientar a escolher conta bloqueada ou recebíveis retidos. |
| `PIX` | Formulário; somente a triagem define se é falsa central e se está no escopo. |
| `DÍVIDA` | Formulário; separar empresa, processo, financiamento ou outro ramo. |
| `FINANCIAMENTO` | Formulário; incluir situação adimplente com parcela insustentável. |
| `RECEBÍVEIS` | Formulário; direcionar ao ramo de recebíveis retidos. |

## Configuração pendente

- Conta ManyChat: bloqueada para auditoria até que um token válido deixe de retornar 401.
- URL pública do formulário: pendente de publicação/configuração; não preencher com URL fictícia.
- Janela de follow-up: respeitar a janela do canal no momento da configuração; não registrar prazo comercial inventado.
- TikTok e Instagram: ativação depende dos acessos e permissões da cliente.
- Rastreamento: só adicionar UTMs depois de definir o link oficial e o contrato de eventos; não inserir IDs privados no documento.
