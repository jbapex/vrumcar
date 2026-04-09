# VrumCar CRM — Especificação Técnica

> Documento mestre. Stack, arquitetura, módulos e integrações de um CRM multi-tenant para lojas de automóveis, projetado desde o início para virar SaaS.

---

## 0. Tese do produto

**O VrumCar existe para dobrar o faturamento de lojas de automóveis.**

Isso não acontece por causa de telas bonitas ou relatórios completos. Acontece porque o sistema **captura, responde e acompanha cada lead com uma consistência que nenhum vendedor humano consegue**.

As 6 alavancas de faturamento que o produto ataca, em ordem de impacto:

1. **Resposta imediata a lead novo** — estudos mostram que responder em menos de 5 minutos converte 9x mais que responder em 1 hora. O sistema garante isso via notificações agressivas, escalonamento automático pro próximo vendedor, e IA que responde quando ninguém tá disponível.

2. **Follow-up que nunca esquece** — vendedor humano esquece, IA não. Lead parado há 24h, 3 dias, 7 dias, 30 dias → régua automática que tenta reativar com mensagens personalizadas.

3. **Inbox unificado multi-canal** — WhatsApp direto + WhatsApp de portais + Instagram Direct + Messenger + portais web tudo num lugar só. Vendedor não precisa abrir 7 apps. Nada se perde.

4. **Gestão inteligente de estoque** — carros parados geram alerta automático. Carros novos são divulgados automaticamente pra leads compatíveis ("entrou um Civic 2020, mandar pra todos que demonstraram interesse em Civic nos últimos 6 meses").

5. **Visibilidade da performance da equipe** — dono vê em tempo real quem tá respondendo rápido, quem tá deixando lead esfriar, quem converte mais. Isso sozinho aumenta produtividade da equipe em 20-30%.

6. **Financiamento e propostas rápidos** — simulação multi-banco em segundos, proposta em PDF bonito pelo WhatsApp, acompanhamento automático de status. Reduz tempo de fechamento de dias pra horas.

**Tudo que for construído precisa servir uma dessas 6 alavancas.** Se uma feature não serve, ela não entra no MVP — entra no backlog ou é cortada.

### IA como pilar, não como enfeite

Diferente de CRMs genéricos que tratam IA como "feature extra", no VrumCar a IA é **central**. Cinco níveis de IA estão mapeados no produto:

- **Nível 1 — Assistente do vendedor**: sugerir resposta, gerar descrição de anúncio, resumir conversa. (Fase 2)
- **Nível 2 — Resposta automática fora do horário**: IA responde leads que chegam às 23h com informações básicas e encaminha pra humano de manhã. (Fase 2.5)
- **Nível 3 — Qualificação automática de leads novos**: IA faz 3-4 perguntas pra entender se o lead é sério antes de passar pro vendedor. (Fase 2)
- **Nível 4 — Agente autônomo de follow-up**: agente que decide sozinho quando abordar leads frios e com qual mensagem. (Fase 3)
- **Nível 5 — IA que navega o sistema**: conversar com o CRM pra pedir relatórios, criar registros, etc. (v2+, futuro)

Cada nível é opcional por plano (Starter não tem IA, Pro tem níveis 1 e 3, Enterprise tem tudo). Isso cria diferenciação de plano que justifica preços maiores.

---

## 1. Visão geral

CRM web multi-tenant para lojas de veículos seminovos/usados. Cada **organização** (loja) tem seus próprios usuários, estoque, leads, anúncios, integrações e billing. O sistema cobre todo o ciclo: captação de lead → qualificação (com IA) → resposta imediata → follow-up automático → test drive → proposta → financiamento → venda → emissão fiscal → pós-venda com régua de relacionamento.

### Princípios de design

1. **Multi-tenant desde o dia 1.** Toda tabela de domínio carrega `organization_id`. Toda query obrigatoriamente filtra por ele. Isolamento garantido por código + RLS no banco como segunda camada.
2. **Filas pra tudo que sai pra fora.** Nada de chamar API externa dentro de request HTTP. Tudo vai pra BullMQ com retry, dead-letter e observabilidade.
3. **Integrações são adapters trocáveis.** Cada integração externa (WhatsApp, portais, financeiras, NF-e) tem uma interface comum e múltiplas implementações.
4. **Auditoria de tudo.** Toda mudança em entidade crítica (lead, veículo, proposta, venda) gera registro em `audit_logs`.
5. **Idempotência em webhooks.** Todo webhook recebido tem `external_id` único e é processado uma única vez.

---

## 2. Stack

### Backend / Frontend
- **Next.js 15** (App Router, Server Actions, Route Handlers)
- **TypeScript** estrito (`strict: true`, `noUncheckedIndexedAccess: true`)
- **Node.js 20 LTS**

### Banco e ORM
- **PostgreSQL 16** (Docker na VPS)
- **Prisma 5** como ORM principal
- **Row Level Security (RLS)** habilitado em todas as tabelas tenant-scoped (segunda camada de defesa)

### Auth
- **Auth.js v5 (NextAuth)** com adapter Prisma
- Modelo customizado: `User` ↔ `Membership` ↔ `Organization` (um usuário pode pertencer a N organizações com papéis distintos)
- Login via e-mail/senha + magic link + Google OAuth
- 2FA opcional (TOTP) pra papéis admin

### Filas e jobs
- **BullMQ** + **Redis 7** (Docker)
- Workers separados do processo web (containers próprios)
- Filas: `whatsapp-out`, `whatsapp-in`, `portals-sync`, `webhooks-in`, `notifications`, `reports`, `nfe`

### Cache e rate limiting
- **Redis** (mesma instância das filas, DB diferente)
- Cache de consultas pesadas (FIPE, cotação de financeira)
- Rate limit por organização e por endpoint

### Storage de arquivos
- **MinIO** self-hosted na VPS (S3-compatível) — fotos de veículos, documentos de clientes, NF-e em PDF/XML
- Pré-assinatura de URLs pra upload direto do cliente

### Billing
- **Asaas** (mercado BR — Pix, boleto, cartão)
- **Stripe** preparado pra quando expandir internacional
- Webhooks de billing → fila → atualização de `subscriptions`

### Observabilidade
- **Sentry** (erros frontend e backend)
- **Better Stack / Logtail** (logs estruturados em JSON)
- **Uptime Kuma** self-hosted (monitoramento de uptime)
- Métricas customizadas: mensagens enviadas, leads criados, sync de portais por organização

### Comunicação interna
- **Resend** ou **AWS SES** pra e-mails transacionais
- Templates em React Email

### Infraestrutura
- **Docker Compose** orquestrando: `web`, `worker`, `postgres`, `redis`, `minio`, `evolution-api`, `nginx`, `sentry-relay`
- **Caddy** ou **Nginx** como reverse proxy com SSL automático (Let's Encrypt)
- **GitHub Actions** pra CI/CD → deploy via SSH na VPS
- Backups automáticos do Postgres pra outro servidor (cron + `pg_dump` + rclone pra storage externo)

---

## 3. Arquitetura multi-tenant

### Modelo escolhido: **shared database, shared schema, com `organization_id` em todas as tabelas**

Por quê não schema-per-tenant ou DB-per-tenant?
- **Schema-per-tenant**: vira pesadelo de migration quando você tem 50+ clientes.
- **DB-per-tenant**: caro e complexo de manter, só faz sentido pra clientes enterprise muito grandes.
- **Shared + RLS**: simples, escala bem até centenas/milhares de tenants, e o Postgres com RLS garante isolamento mesmo se houver bug no código de aplicação.

### Camadas de isolamento

1. **Aplicação**: toda query Prisma é feita por meio de um helper `getTenantPrisma(orgId)` que injeta o filtro automaticamente. Não existe `prisma.vehicle.findMany()` no código de domínio — só `tenantDb.vehicle.findMany()`.
2. **Banco (RLS)**: cada conexão de aplicação seta `SET app.current_org_id = '<uuid>'` no início da transação. As policies de RLS filtram por `current_setting('app.current_org_id')`.
3. **Storage**: arquivos no MinIO ficam em buckets/prefixos por organização: `org-{orgId}/vehicles/{vehicleId}/photo-1.jpg`.
4. **Filas**: cada job carrega `organizationId` no payload. Workers validam antes de executar.

### Hierarquia de permissões (RBAC)

Papéis dentro de uma organização:
- **OWNER** — dono da loja, acesso total + billing
- **ADMIN** — gestor, acesso total exceto billing
- **MANAGER** — gerente de vendas, vê tudo da equipe, não mexe em config
- **SALES** — vendedor, vê só seus leads e o estoque
- **FINANCE** — financeiro, vê propostas/vendas/comissões
- **VIEWER** — somente leitura (sócio, contador)

Permissões definidas em `lib/auth/permissions.ts` como matriz `{ role, resource, action }`.

### Plano super-admin (SaaS)
Tabela separada `platform_admins` (usuários da Anthropic — quer dizer, sua empresa SaaS) com acesso ao painel `/platform` que vê todas as organizações, métricas globais, gestão de planos, suporte etc. **Nunca confundir com admin de organização.**

---

## 4. Módulos do CRM

### 4.1 Estoque de veículos

**Entidades:** `Vehicle`, `VehiclePhoto`, `VehicleHistory`, `VehiclePricing`, `VehicleDocument`.

**Funcionalidades:**
- Cadastro completo: marca, modelo, versão, ano modelo/fabricação, cor, KM, câmbio, combustível, placa, chassi, RENAVAM, opcionais (multi-select), observações.
- **Integração FIPE**: ao cadastrar, busca código FIPE automaticamente e traz preço de referência. Atualização semanal automática (cron).
- **Galeria de fotos**: upload múltiplo, ordenação drag-and-drop, marca d'água automática opcional, redimensionamento para web (Sharp).
- **Histórico de preço**: toda alteração de preço gera registro com usuário, data, motivo.
- **Status**: `DISPONIVEL`, `RESERVADO`, `VENDIDO`, `EM_PREPARACAO`, `EM_MANUTENCAO`, `INATIVO`.
- **Custos do veículo**: valor de entrada, despesas (transferência, polimento, mecânica), valor de venda, lucro calculado.
- **Documentos**: upload de CRLV, laudo cautelar, etc.
- **Geração de descrição com IA**: botão "Gerar descrição" que chama Claude API com os dados do veículo e gera texto pronto pra anúncio.

### 4.2 Leads e clientes

**Entidades:** `Lead`, `Customer`, `LeadSource`, `LeadInteraction`, `Tag`.

**Funcionalidades:**
- Captura de leads de múltiplas origens: formulário do site, WhatsApp, portais (Webmotors/OLX/iCarros via webhook ou scraping), indicação, walk-in.
- Cadastro: nome, telefone, e-mail, CPF, origem, veículo de interesse, observações, tags.
- **Deduplicação** automática por telefone/CPF (com merge manual quando ambíguo).
- **Histórico unificado**: timeline com toda interação (mensagem WhatsApp, ligação registrada, e-mail enviado, visita agendada, proposta feita).
- **Atribuição automática** ou manual a vendedor. Regras configuráveis (round-robin, por origem, por veículo).
- **Lead scoring** simples: pontuação baseada em ações (respondeu mensagem, agendou visita, simulou financiamento).
- **Conversão lead → cliente**: ao fechar venda, lead vira `Customer` com dados completos.

### 4.3 Funil de vendas (pipeline)

**Entidades:** `Pipeline`, `PipelineStage`, `Deal`.

**Funcionalidades:**
- Pipelines configuráveis por organização (ex: "Vendas seminovos", "Vendas 0km").
- Etapas customizáveis: ex. `Novo lead` → `Contato feito` → `Visita agendada` → `Test drive` → `Proposta` → `Negociação` → `Financiamento` → `Fechado ganho` / `Fechado perdido`.
- **Visualização Kanban** com drag-and-drop.
- Cada deal tem: lead vinculado, veículo de interesse, valor estimado, vendedor, data prevista de fechamento.
- **Motivos de perda** configuráveis (preço, foi pra concorrência, desistiu, sem crédito, etc.).
- **Automações por etapa** (ver módulo 4.6): "ao mover pra etapa X, dispara ação Y".

### 4.4 Atendimento WhatsApp (inbox)

**Entidades:** `WhatsAppInstance`, `Conversation`, `Message`, `MessageTemplate`.

**Funcionalidades:**
- **Inbox unificado** estilo WhatsApp Web dentro do CRM.
- Cada vendedor vê suas conversas + as não atribuídas. Gerentes veem tudo.
- Cada organização pode ter **múltiplas instâncias** (números) — uazapi, Cloud API ou Evolution misturadas livremente.
- **Templates HSM** (Cloud API) e **mensagens livres** (uazapi e Evolution).
- Envio de mídia: fotos, vídeos, áudio, PDF, localização.
- **Atalhos rápidos**: respostas pré-prontas configuráveis pela equipe.
- **Encaminhamento**: vendedor pode passar conversa pra outro vendedor / gerente.
- **Tags em conversa** e vinculação automática a lead/deal.
- **IA opcional**: sugestão de resposta usando Claude API com contexto da conversa + dados do veículo.

### 4.5 Test drives e agendamentos

**Entidades:** `Appointment`, `TestDrive`.

- Agenda da loja com visualização semanal/diária.
- Tipos: visita, test drive, vistoria de troca, entrega de veículo.
- Conflito de horário detectado (mesmo veículo / mesmo vendedor).
- Lembretes automáticos via WhatsApp 24h antes e 1h antes.
- Check-in / check-out de test drive com registro de KM, hora e (opcional) foto da CNH do cliente.

### 4.6 Automações (o coração do "dobrar faturamento")

**Entidades:** `Automation`, `AutomationTrigger`, `AutomationAction`, `AutomationRun`.

Motor de automações estilo Zapier interno. **Esta é a feature mais importante do produto** — é onde as alavancas 1, 2 e 6 da tese do produto são executadas.

**Triggers:**
- `lead.created` (com filtros: origem = X, veículo de interesse contém Y)
- `lead.stage_changed` (de A para B)
- `lead.no_response_for` (X horas sem resposta do vendedor)
- `lead.customer_no_response_for` (X horas sem resposta do cliente)
- `lead.cold` (N dias inativo)
- `vehicle.created`
- `vehicle.price_changed`
- `vehicle.stuck_in_stock` (parado há mais de X dias)
- `appointment.scheduled`
- `appointment.no_show`
- `appointment.completed`
- `deal.won` / `deal.lost`
- `sale.completed` (pra régua pós-venda)
- `customer.birthday`
- `customer.purchase_anniversary` (1 ano da compra, 2 anos, etc)
- `cron` (agendado: todo dia às X, toda segunda às Y)

**Actions:**
- Enviar mensagem WhatsApp (template HSM ou texto livre)
- Enviar mensagem Instagram / Messenger
- Enviar e-mail
- Criar tarefa pro vendedor ("ligar pra fulano")
- Escalonar lead (reatribuir pra outro vendedor / gerente)
- Notificar dono (push + WhatsApp no número pessoal)
- Mudar etapa do deal
- Atribuir a vendedor
- Adicionar/remover tag
- Chamar webhook externo
- Esperar X tempo (delay)
- Condicional (if/else baseado em dados do lead)
- **Chamar IA** (nível 1-3) pra gerar mensagem personalizada

**UI:** editor visual de fluxo (React Flow). MVP pode ser formulário simples.

### Automações pré-configuradas (templates prontos)

Ao criar uma organização, essas automações já vêm instaladas e ativas (o cliente pode desativar se quiser):

**1. Resposta imediata a lead novo**
- Trigger: `lead.created`
- Action 1: notifica vendedor atribuído (push + som no app)
- Action 2 (se `lead.no_response_for` 5min): notifica outro vendedor
- Action 3 (se `lead.no_response_for` 15min): alerta pro dono + aciona IA Nível 2 (responder automaticamente enquanto humano não aparece)

**2. Follow-up de lead sem resposta do cliente**
- Trigger: `lead.customer_no_response_for` 24h (cliente viu a mensagem e não respondeu)
- Action: manda mensagem 1 ("oi fulano, tudo bem? ainda tá interessado no {modelo}?")

**3. Follow-up de lead frio 3 dias**
- Trigger: `lead.customer_no_response_for` 72h
- Action: IA Nível 1 gera mensagem personalizada baseada no histórico

**4. Follow-up de lead frio 7 dias**
- Trigger: `lead.customer_no_response_for` 168h
- Action: manda mensagem 3 (tentativa final de recuperação, oferta especial)

**5. Lead frio 15 dias → arquiva**
- Trigger: `lead.customer_no_response_for` 360h
- Action: marca lead como `LOST`, move pra lista de reativação futura

**6. Alerta de carro parado**
- Trigger: `vehicle.stuck_in_stock` 60 dias
- Action: notifica dono ("o {marca} {modelo} tá parado há 60 dias, considerar baixar preço ou mover pra outro canal")

**7. Divulgação automática de carro novo**
- Trigger: `vehicle.created`
- Action: busca leads que demonstraram interesse no mesmo modelo/marca nos últimos 6 meses, manda WhatsApp "acabou de chegar um {modelo} que tem tua cara, quer ver?"

**8. Régua pós-venda**
- Trigger: `sale.completed` + delay 3d / 30d / 90d / 180d / 365d
- Action: mensagens progressivas ("tudo bem com o carro?", "primeira revisão", "aniversário de 1 ano", etc)

**9. Aniversário do cliente**
- Trigger: `customer.birthday`
- Action: mensagem de parabéns personalizada

**10. Reativação de cliente pós 2 anos**
- Trigger: `customer.purchase_anniversary` 2 anos
- Action: "oi fulano, tá na hora de trocar de carro? tenho algumas opções interessantes"

**Tudo isso é configurável e desativável por organização.** Clientes mais simples podem usar só essas 10. Clientes avançados criam automações customizadas.

---

### 4.7 Inbox unificado multi-canal

**Entidades:** `Channel`, `ChannelInstance`, `Conversation`, `Message`, `MessageTemplate`.

Esta é a **alavanca 3** da tese do produto. Consolidar todos os canais de atendimento num inbox só elimina o caos de abrir 7 apps diferentes.

**Canais suportados** (em ordem de prioridade de implementação):

| Canal | Como conecta | Fase |
|---|---|---|
| WhatsApp via uazapi | Token por instância | Fase 1 |
| WhatsApp Cloud API (Meta) | phone_number_id + access_token | Fase 2 |
| WhatsApp via Evolution self-hosted | API key + instance name | Fase 2 |
| Instagram Direct | OAuth Meta Business (junto com Cloud API) | Fase 2.5 |
| Facebook Messenger | OAuth Meta Business (junto com Cloud API) | Fase 2.5 |
| Webmotors (mensagens internas) | API parceiro | Fase 3 |
| OLX (mensagens internas) | API parceiro | Fase 3 |
| Mercado Livre Veículos | API pública | Fase 2 |
| iCarros (mensagens internas) | Parser de email ou API | Fase 3 |
| E-mail | SMTP inbound | Fase 3 |

**Funcionalidades do inbox:**

- **Inbox unificado** estilo WhatsApp Web, com TODOS os canais misturados
- Cada conversa mostra ícone do canal de origem
- Filtros por canal, vendedor, status, tags
- Cada vendedor vê suas conversas + as não atribuídas; gerentes veem tudo
- **Timeline unificada por cliente**: quando o cliente Fulano mandou mensagem pelo WhatsApp em janeiro, comentário no anúncio da OLX em março, e DM no Instagram em maio, tudo aparece numa única timeline ordenada por data
- Envio de mídia: fotos, vídeos, áudio, PDF, localização
- **Atalhos rápidos**: respostas pré-prontas configuráveis pela equipe
- **Encaminhamento** entre vendedores/gerentes
- **Tags em conversa** e vinculação automática a lead/deal
- **Notificação agressiva** de nova mensagem (som + push + badge)
- **Tempo de resposta visível**: cada conversa mostra "há 3 minutos", "há 2 horas", e colorido de vermelho se passou do SLA configurado

**Unificação de cliente cross-canal:**
Quando uma mensagem chega pelo Instagram com o username `@fulano_silva`, o sistema tenta identificar se é o mesmo `Fulano Silva` que já tem lead no sistema via WhatsApp. Isso é feito por:
- Matching de número de telefone (se o lead já tem telefone salvo)
- Matching manual (botão "esse é o Fulano Silva que já existe?")
- IA de matching (futuro, Fase 3+)

---

### 4.8 IA assistente e automação inteligente

**Entidades:** `AiPrompt`, `AiExecution`, `AiKnowledgeBase`, `AiContext`.

Esta é a **grande diferenciação** do VrumCar em relação a CRMs genéricos como Kommo. A IA está integrada ao fluxo de trabalho, não é um chatbot solto.

#### Nível 1 — Assistente do vendedor (Fase 2)

Botões dentro do inbox e do cadastro de veículo:

- **"Sugerir resposta"**: olha as últimas 20 mensagens da conversa + dados do lead + carro de interesse + estoque atual → chama Claude API → retorna 2-3 sugestões de resposta. Vendedor escolhe uma, edita se quiser, envia.
- **"Gerar descrição do anúncio"**: pega dados do veículo (marca, modelo, ano, opcionais, KM, etc) → Claude API → retorna texto pronto pra anúncio nos portais. Vendedor revisa e aprova.
- **"Resumir conversa"**: pega 50+ mensagens e gera resumo de 3 linhas com os pontos principais. Útil pra gerente entender rápido uma conversa longa.
- **"Extrair dados do lead"**: lead mandou mensagem contando várias coisas ("tenho um Gol 2015, quero trocar por um sedan, posso dar 15 mil de entrada"). IA extrai e preenche automaticamente os campos do lead (tem carro pra troca, entrada, interesse, etc).

**Custo**: ~R$ 0,10-0,30 por execução (Claude Haiku pros simples, Sonnet pros complexos).

#### Nível 2 — Resposta automática fora do horário (Fase 2.5)

**A feature mais ambiciosa do produto.** Quando um lead chega às 23h e ninguém responde, a IA responde automaticamente com informações básicas, mantém o lead engajado, e de manhã passa a conversa pro vendedor humano.

**Funcionamento:**
1. Lead manda mensagem fora do horário comercial (configurável: ex. "das 19h às 8h, e finais de semana")
2. Sistema aguarda 2 minutos pra ver se vendedor responde (às vezes tá respondendo mesmo fora do horário)
3. Se não responder, aciona IA com contexto: histórico da conversa + estoque disponível + políticas da loja + base de conhecimento configurada
4. IA responde com tom configurado (formal/casual/etc)
5. IA sabe quando **não** responder e encaminha: "deixa eu confirmar isso com o vendedor responsável, ele te responde amanhã cedo"
6. Conversa fica marcada com flag `ai_handled` pra vendedor humano saber o que aconteceu
7. De manhã, vendedor vê no inbox as conversas que a IA cuidou à noite

**Salvaguardas obrigatórias:**
- IA **nunca** fala preço que não tá no estoque (evita dar informação errada)
- IA **nunca** promete nada que exige aprovação (desconto, financiamento especial, etc)
- IA **nunca** afirma disponibilidade de carro sem checar o estoque em tempo real
- IA **sempre** se identifica como assistente: "Oi! Sou o assistente virtual da [Loja]. Posso te ajudar com informações básicas enquanto o vendedor está fora"
- Cliente pode digitar "quero falar com humano" → encaminha imediatamente
- Todas as respostas da IA ficam logadas pra auditoria

**Base de conhecimento configurável pela loja:**
- Horário de funcionamento
- Endereço e mapa
- Políticas de financiamento (bancos parceiros, condições típicas)
- Formas de pagamento aceitas
- Política de troca e garantia
- Textos institucionais ("sobre a loja", "diferenciais")

**Custo**: ~R$ 0,30-1 por conversa (depende do tamanho). Vale MUITO a pena — recuperar 1 venda perdida paga 100 conversas da IA.

#### Nível 3 — Qualificação automática de leads (Fase 2)

Quando chega um lead novo, a IA faz 3-4 perguntas pra qualificar antes de passar pro vendedor. Isso filtra curiosos e deixa vendedor focado em leads sérios.

**Exemplo de fluxo**:
1. Lead: "Oi, quero saber do Civic 2020"
2. IA: "Oi! Sou a assistente da [Loja]. Pra te ajudar melhor, tá procurando pra comprar agora ou tá pesquisando?"
3. Lead: "Tô pesquisando ainda"
4. IA: "Entendi. Tem prazo em mente? Semanas, meses?"
5. Lead: "Uns 2 meses"
6. IA: "Tem um carro atual pra dar de entrada ou prefere sem troca?"
7. Lead: "Sem troca, vou financiar"
8. IA: "Perfeito! Tá pensando em qual valor de entrada, mais ou menos?"
9. Lead: "Uns 20 mil"
10. IA: "Ótimo! Vou passar pra nossa equipe, alguém te responde agora com opções. Enquanto isso, aqui tá o link com as fotos do Civic 2020 que temos: [link]"

O lead já chega pro vendedor **pré-qualificado**: sabe-se que é financiamento, 20k de entrada, prazo 2 meses. Vendedor já começa direto no pitch certo.

**Configurável por loja:** quantas perguntas, quais perguntas, quando acionar, quando pular direto pro humano.

#### Nível 4 — Agente de follow-up autônomo (Fase 3)

Agente em background que olha leads parados e decide **sozinho**:
- Quando abordar (horário apropriado, não em madrugada ou domingo)
- Que mensagem mandar (personalizada baseada no que foi conversado antes)
- Quando desistir (parar de tentar depois de N tentativas)

Usa mesmo princípio de salvaguardas do Nível 2. Pode ser desligado a qualquer momento.

#### Nível 5 — IA conversacional que opera o CRM (v2+)

Futuro distante. Exemplo: "Claude, quantos Civics vendi esse mês?" e ela navega o sistema e responde. Não faz parte do roadmap inicial.

---

### 4.9 Dashboard de resposta em tempo real

**Entidade:** usa dados de `Conversation` e `Lead` existentes.

Tela especial que o **dono** olha várias vezes ao dia. Mostra:

- **Leads aguardando primeira resposta** (tempo decorrido em vermelho se passou do SLA)
- **Conversas abertas por vendedor** (quem tem quantas)
- **Tempo médio de resposta de cada vendedor** (últimas 24h, 7 dias, 30 dias)
- **Leads sem resposta há mais de X horas** (configurável, default 2h)
- **Taxa de resposta em 5min / 15min / 1h**
- **Ranking de vendedores** por tempo de resposta e taxa de conversão

**Alertas em tempo real:**
- "⚠️ Lead do Webmotors há 12 minutos sem resposta"
- "⚠️ Vendedor João com 8 conversas abertas, média de resposta 45min (acima do SLA)"
- "🔥 Lead quente (IA Nível 3 qualificou como pronto pra comprar) atribuído ao Carlos — não deixar esfriar"

Esta tela sozinha **muda o comportamento da equipe** porque torna invisível o que antes era invisível. Vendedor que antes "esquecia" de responder passa a responder porque sabe que o dono tá vendo.

### 4.10 Anúncios e portais

**Entidades:** `Listing`, `ListingChannel`, `ListingSyncLog`.

- Cada veículo pode ser anunciado em N canais (Webmotors, OLX, iCarros, Mercado Livre, site próprio).
- **Sync bidirecional** quando o portal suporta API. Quando não suporta, fallback é gerar XML/JSON pro feed que o portal consome.
- Dashboard mostra status de cada anúncio por veículo: ativo, expirado, com erro.
- Leads vindos de portal entram automaticamente via webhook do canal.

### 4.11 Financiamento e simulação

**Entidades:** `FinanceSimulation`, `FinanceProposal`, `Bank`.

- Cadastro de bancos parceiros e taxas vigentes.
- Simulação multi-banco em uma tela (Santander, BV, Bradesco, Itaú, Pan, Omni, Creditas) — algumas via API, outras via formulário interno.
- Geração de proposta em PDF.
- Status da proposta: `EM_ANALISE`, `APROVADA`, `REPROVADA`, `CONTRATADA`.
- Webhook das financeiras (quando disponível) atualiza status automaticamente.

### 4.12 Vendas e contratos

**Entidades:** `Sale`, `Contract`, `Commission`.

- Fechamento da venda: cliente, veículo, valor, forma de pagamento (à vista, financiamento, troca, consórcio), comissão do vendedor.
- Geração de **contrato em PDF** a partir de template configurável (handlebars).
- Cálculo automático de comissão por regra: % fixo, escalonado por meta, etc.
- Vinculação à NF-e (módulo 4.10).

### 4.13 Fiscal (NF-e)

**Entidades:** `Invoice`, `InvoiceItem`.

- Integração com **PlugNotas** ou **Focus NFe** (recomendo PlugNotas — mais simples e suporte BR melhor).
- Emissão de NF-e modelo 55 ou nota de venda de veículo conforme regras estaduais.
- Armazenamento de XML e DANFE PDF no MinIO.
- Cancelamento e carta de correção via interface.
- **Importante**: cada organização precisa subir seu próprio certificado A1 (criptografado no banco com chave da aplicação).

### 4.14 Pós-venda (régua de relacionamento)

Esta seção virou parte das **automações pré-configuradas** (ver 4.6). Resumindo o que entra:

- Régua de relacionamento automática: mensagem 7 dias após venda, 30 dias, 90 dias, aniversário, aniversário do veículo.
- Pesquisa NPS automatizada.
- Lembretes de manutenção / revisão.
- Reativação de leads frios (ex: 60 dias sem interação → automação).

### 4.15 Relatórios e BI

- **Dashboard principal**: leads do mês, conversão por etapa, ticket médio, lucro bruto, vendedor do mês, veículos parados há mais de 60 dias.
- **Relatórios específicos**: funil de vendas, performance por vendedor, performance por origem de lead, tempo médio em cada etapa, giro de estoque.
- Exportação CSV/Excel.
- Filtros por período, vendedor, origem, marca/modelo.

### 4.16 Configurações da organização

- Dados da loja, logo, CNPJ, endereço.
- Usuários e papéis.
- Pipelines e etapas.
- Templates de mensagem e e-mail.
- Origens de lead.
- Bancos parceiros.
- Integrações (chaves de API).
- Automações.
- Plano e billing.

### 4.17 Painel de plataforma (super-admin SaaS)

Rota `/platform`, acessível apenas a `platform_admins`.

- Lista de todas as organizações, com filtro por plano, status, MRR.
- Métricas globais: MRR, churn, leads/mês criados, mensagens enviadas, uso de storage.
- Suporte: impersonar usuário (com auditoria), ver logs por org.
- Gestão de planos e features flags.
- Alertas: orgs com erro de billing, orgs com integração quebrada há mais de 24h.

---

## 5. Integrações detalhadas

### 5.1 WhatsApp — abstração de provider

**Interface comum** (`lib/integrations/whatsapp/provider.ts`):

```ts
interface WhatsAppProvider {
  sendText(to: string, text: string): Promise<MessageResult>;
  sendMedia(to: string, media: MediaInput): Promise<MessageResult>;
  sendTemplate(to: string, templateName: string, vars: Record<string, string>): Promise<MessageResult>;
  receiveWebhook(payload: unknown): Promise<NormalizedEvent[]>;
}
```

**Três adapters disponíveis.** A escolha é por instância (cada loja pode ter números rodando providers diferentes).

#### A) Cloud API (oficial Meta)
- **Pré-requisitos**: conta Business no Meta, número verificado, displayName aprovado, templates HSM aprovados.
- **Custos**: pagos por conversa (categorias: marketing, utility, authentication, service). Brasil ~R$ 0,30–0,80 por conversa.
- **Vantagens**: estável, oficial, sem risco de banimento, recursos avançados (botões, listas).
- **Limitação**: mensagens promocionais só via template HSM aprovado fora da janela de 24h.
- **Estado**: zero estado local — Meta cuida de tudo.
- **Webhook**: configurar URL pública pra receber mensagens, status, etc.
- Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

#### B) uazapi (gerenciada, baseada em Baileys) — **DEFAULT recomendado**
- Serviço SaaS brasileiro que expõe API REST pra sessões WhatsApp.
- Cada loja cria uma instância no painel da uazapi, gera token, cola no CRM.
- **Custos**: mensalidade fixa por instância (mais barato que Cloud API pra volume médio).
- **Vantagens críticas**:
  - **Zero estado local** — sessão mora no servidor da uazapi, NÃO na sua VPS. Se você reinstalar a VPS, restaurar backup, migrar de servidor, perder o disco — o WhatsApp continua conectado lá. Cliente nunca precisa escanear QR code de novo por causa de problema seu.
  - Mensagens livres sem template (igual ao WhatsApp Web normal).
  - Setup trivial: cria conta, gera token, pronto.
  - Não exige container próprio na sua infra.
- **Riscos**: número pode ser banido pelo WhatsApp se enviar spam (igual a qualquer não-oficial). Dependência de fornecedor terceiro (mitigada pela abstração — você troca de adapter em horas se precisar).
- Docs: https://docs.uazapi.com

#### C) Evolution API (não-oficial, self-hosted)
- Servidor Node que expõe API REST/WebSocket pra Baileys (lib que faz engenharia reversa do WhatsApp Web).
- Roda como container próprio no docker-compose, na sua VPS.
- **Custos**: zero (só infra).
- **Vantagens**: custo zero, controle total, sem dependência de terceiro.
- **Desvantagens**:
  - **Estado local** — sessão mora num volume Docker. Se o volume corromper, VPS reiniciar com problema, ou você precisar migrar/restaurar — cliente precisa escanear QR code de novo no celular. Em fim de semana isso é dor.
  - Você é responsável por manter o container vivo, atualizado, monitorado.
- **Riscos**: mesmos da uazapi (não-oficial).
- Cada instância = um número conectado via QR code.
- Docs: https://doc.evolution-api.com

#### Estratégia recomendada

| Cenário | Provider sugerido | Por quê |
|---|---|---|
| **Default no onboarding** | uazapi | Setup mais simples, sem dor de cabeça operacional, stateless |
| **Disparos em massa, marketing, transacionais críticos** | Cloud API | Oficial, sem risco de banimento, regulamentado |
| **Cliente que insiste em custo zero** | Evolution | Zero custo de licença, mas exige que o cliente aceite o trade-off |
| **Mix poderoso** | uazapi (atendimento) + Cloud API (campanhas) | Aproveita o melhor dos dois mundos |

A UI permite escolher por instância, e uma mesma loja pode ter várias instâncias com providers diferentes ao mesmo tempo (ex: número de atendimento na uazapi, número de marketing na Cloud API).

### 5.2 Portais de anúncio

#### Webmotors
- **API oficial existe**, mas é restrita a parceiros homologados. Processo de homologação demorado.
- **Alternativa**: feed XML (formato Webmotors) que você gera e publica numa URL, e o Webmotors importa periodicamente.
- Recomendação MVP: feed XML.

#### OLX (Autos)
- API REST disponível pra anunciantes profissionais com contrato.
- Suporta criação, edição, pause de anúncios e webhook de leads.
- Docs: https://api.olx.com.br

#### iCarros
- Integração via XML/JSON feed.
- Leads chegam por e-mail (parser) ou webhook (planos pagos).

#### Mercado Livre Veículos
- API oficial robusta. OAuth, criação de anúncio, recebimento de perguntas/leads via webhook.
- Docs: https://developers.mercadolivre.com.br

**Padrão de implementação**: cada portal é um adapter `PortalProvider` com `publish`, `update`, `pause`, `delete`, `fetchLeads`, `handleWebhook`. Sync rodando em fila a cada X minutos.

### 5.3 Tabela FIPE

- **API gratuita não-oficial**: https://deniscostadsc.github.io/parallelum/ (mantida pela comunidade, estável).
- **Alternativa paga**: API oficial da FIPE (caro, normalmente desnecessário).
- Cache agressivo: dados FIPE mudam mensalmente, não precisa consultar a cada request.
- Job mensal sincroniza marcas/modelos/anos pra um cache local em `fipe_cache`.

### 5.4 Financeiras

Cada banco tem realidade própria. **Não existe API unificada de financiamento de veículos no Brasil**. Caminhos:

- **Santander Financiamentos**: API B2B, exige contrato.
- **BV Financeira**: portal de parceiros + API restrita.
- **Bradesco Financiamentos**: integração via portal SOAP legado.
- **Creditas**: API moderna REST, mais fácil pra começar. https://docs.creditas.com
- **Pan, Omni, Sinosserra**: portais próprios, geralmente sem API pública.

**Recomendação MVP**: começar com Creditas (API moderna) + formulário manual pros outros. Conforme o cliente exigir, ir adicionando.

### 5.5 NF-e

- **PlugNotas** (https://plugnotas.com.br) — recomendado. API REST simples, suporte BR, preços razoáveis.
- **Focus NFe** (https://focusnfe.com.br) — também ótimo, opção alternativa.
- Ambos cuidam de homologação, certificado, SEFAZ, contingência.
- Você só precisa: subir certificado A1 do cliente, mandar JSON com os dados da nota, receber XML/PDF assinados.

### 5.6 Tabela FIPE / Placa
- **API de consulta de placa**: APIs como Apilayer, Sinesp (instável), Wipe API. Útil pra preencher dados do veículo automaticamente quando vendedor digita a placa.

### 5.7 Asaas (billing)
- API REST pra criar customers, subscriptions, charges.
- Webhooks pra eventos de pagamento confirmado, atrasado, cancelado.
- Docs: https://docs.asaas.com

---

## 6. Segurança

- **Senhas**: bcrypt (cost 12).
- **Sessions**: JWT assinado + cookie httpOnly + secure + sameSite=lax.
- **CSRF**: Auth.js já cuida.
- **SQL injection**: Prisma já protege.
- **XSS**: React já protege; sanitizar conteúdo HTML quando renderizado (DOMPurify).
- **Credenciais de integração**: criptografadas com AES-256-GCM usando chave em variável de ambiente. Nunca em log nem em response da API.
- **Rate limiting**: 100 req/min por IP, 1000 req/min por organização. Endpoint de login: 5 tentativas / 15 min.
- **Audit log**: toda ação sensível registrada com user_id, org_id, ip, user_agent, payload.
- **Backup**: `pg_dump` diário criptografado, retenção 30 dias, enviado pra storage externo.
- **LGPD**:
  - Termos de uso e política de privacidade aceitos no signup.
  - Endpoint de exportação de dados pessoais (do cliente final, ex: lead pedindo seus dados).
  - Endpoint de exclusão (com soft delete e job de hard delete após 30 dias).
  - Logs de acesso a dados pessoais.

---

## 7. Performance e escala

- Índices compostos em `(organization_id, created_at)` em todas as tabelas grandes.
- Paginação cursor-based em listas grandes (não offset).
- Imagens servidas via CDN (Cloudflare na frente do MinIO) com cache longo.
- Server Components do Next reduzem JS no cliente.
- Workers BullMQ horizontalmente escaláveis (múltiplos containers).
- Postgres connection pool via PgBouncer quando passar de ~50 organizações ativas.

---

## 8. Estrutura de pastas (Next.js App Router)

```
/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── (app)/
│   │   │   ├── [orgSlug]/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── vehicles/
│   │   │   │   ├── leads/
│   │   │   │   ├── pipeline/
│   │   │   │   ├── inbox/
│   │   │   │   ├── automations/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   ├── (platform)/
│   │   │   └── platform/
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── whatsapp/cloud/
│   │   │   │   ├── whatsapp/evolution/
│   │   │   │   ├── asaas/
│   │   │   │   ├── olx/
│   │   │   │   └── ...
│   │   │   └── public/
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── db/                    # Prisma client + tenant helpers
│   │   ├── auth/                  # Auth.js config + permissions
│   │   ├── queue/                 # BullMQ setup + queue definitions
│   │   ├── integrations/
│   │   │   ├── whatsapp/
│   │   │   │   ├── provider.ts    # Interface
│   │   │   │   ├── factory.ts     # Retorna provider certo dada uma instance
│   │   │   │   ├── cloud-api.ts   # Adapter Meta
│   │   │   │   ├── uazapi.ts      # Adapter uazapi (DEFAULT)
│   │   │   │   └── evolution.ts   # Adapter Evolution self-hosted
│   │   │   ├── portals/
│   │   │   ├── fipe/
│   │   │   ├── nfe/
│   │   │   ├── billing/
│   │   │   └── financing/
│   │   ├── automations/           # Engine de automações
│   │   ├── storage/               # MinIO client
│   │   └── utils/
│   ├── modules/                   # Lógica de domínio por módulo
│   │   ├── vehicles/
│   │   ├── leads/
│   │   ├── deals/
│   │   ├── messaging/
│   │   ├── billing/
│   │   └── ...
│   ├── components/                # UI components compartilhados
│   │   ├── ui/                    # shadcn/ui
│   │   └── ...
│   └── workers/                   # Entry points dos workers BullMQ
│       ├── whatsapp.worker.ts
│       ├── portals.worker.ts
│       └── ...
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.web
│   ├── Dockerfile.worker
│   └── nginx.conf
├── .env.example
├── package.json
└── README.md
```

---

## 9. Variáveis de ambiente (esqueleto)

```bash
# Database
DATABASE_URL="postgresql://crm:senha@postgres:5432/crm"

# Redis
REDIS_URL="redis://redis:6379"

# Auth
AUTH_SECRET="..."   # openssl rand -base64 32
AUTH_URL="https://app.seudominio.com"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Encryption (pra credenciais de integração)
ENCRYPTION_KEY="..."   # 32 bytes hex

# Storage
S3_ENDPOINT="https://minio.seudominio.com"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
S3_BUCKET="crm"

# WhatsApp Cloud API
WHATSAPP_CLOUD_VERIFY_TOKEN="..."

# uazapi (default sugerido)
# Não precisa de credencial global — token é por instância, salvo criptografado no banco.
# Apenas a base URL padrão (cliente pode sobrescrever por instância se usar self-hosted da uazapi):
UAZAPI_DEFAULT_BASE_URL="https://free.uazapi.com"

# Evolution API (self-hosted, opcional)
EVOLUTION_API_URL="http://evolution:8080"
EVOLUTION_API_KEY="..."

# Asaas
ASAAS_API_KEY="..."
ASAAS_WEBHOOK_TOKEN="..."

# PlugNotas
PLUGNOTAS_API_KEY="..."

# Sentry
SENTRY_DSN="..."

# Email
RESEND_API_KEY="..."
EMAIL_FROM="noreply@seudominio.com"

# AI (Claude API) — pilar do produto, não opcional
ANTHROPIC_API_KEY="..."
AI_DEFAULT_MODEL="claude-sonnet-4-6"
AI_BUDGET_MODEL="claude-haiku-4-5"  # pra tarefas simples (sugestão de resposta, extração)

# Meta Business (WhatsApp Cloud + Instagram + Messenger, tudo no mesmo OAuth)
META_APP_ID="..."
META_APP_SECRET="..."
META_WEBHOOK_VERIFY_TOKEN="..."
```

---

## 10. O que NÃO entra no MVP (importante)

Pra não cair na armadilha de querer fazer tudo de uma vez, deixo explícito o que fica de fora da v1:

- App mobile nativo (PWA resolve no início).
- Integração com todas as financeiras (só Creditas + manual no MVP).
- BI avançado (gráficos básicos no MVP, BI dedicado depois).
- Marketplace de templates de automação.
- Multi-idioma (só PT-BR).
- White-label completo (logo customizado é suficiente).
- App de assinatura digital de contratos (manda PDF e o cliente assina por fora).

Tudo isso entra na v2+ depois de validar com clientes pagantes.

---

## 11. Princípios de stateless (lição que importa)

**Toda peça stateful que você mantém na sua infra é uma chance futura de você ser acordado às 3 da manhã.**

Estado crítico que NÃO deveria morar na sua VPS sempre que possível:

| Estado | Onde NÃO deveria ficar | Onde MELHOR ficar |
|---|---|---|
| Sessão WhatsApp | Volume Docker do Evolution | uazapi / Cloud API (gerenciados) |
| Certificado A1 da NF-e | Disco local do servidor | PlugNotas / Focus NFe |
| Arquivos de mídia (longo prazo) | MinIO self-hosted | Cloudflare R2 / Backblaze B2 |
| Banco de dados (depois de escalar) | Postgres na sua VPS | Neon / Supabase managed |

### A regra

Tudo que carrega estado entre reinícios e que é difícil ou impossível de recuperar deve ser **terceirizado a quem cobra pra cuidar disso**. Você troca um pouco de margem por sono tranquilo e zero ticket de suporte de "meu sistema parou".

### Por que isso é arquitetura sênior

Seu Next.js é stateless (sessões no banco). Seu Postgres tem backup. Seu Redis pode ser perdido (jobs reagendam sozinhos). Seu MinIO tem replicação. **A única coisa stateful crítica e difícil de recuperar num CRM normal é a sessão de WhatsApp** — e tirando ela da sua infra, você tem um sistema onde **qualquer parte pode morrer e voltar sem intervenção manual do cliente final**.

Disaster recovery vira: `git pull && docker compose up -d && pg_restore`. Pronto. WhatsApp continua conectado, certificado fiscal continua válido, arquivos continuam acessíveis. Esse é o padrão pra mirar.

### Quando vale a pena ser stateful

- Cliente exige custo zero E aceita o trade-off conscientemente (Evolution self-hosted é OK nesse caso).
- Volume é tão grande que terceirizar fica caro demais.
- Compliance / soberania de dados exige que tudo fique sob seu controle direto.

Fora desses casos, prefira sempre tirar estado da sua infra. Mesmo pagando um pouco mais.

### Mitigação de vendor lock-in

O risco óbvio de terceirizar estado é depender do fornecedor. A defesa é a **abstração de adapter**: toda integração externa tem uma interface comum no seu código, e o fornecedor é só uma implementação. Se a uazapi sumir, suba prejuízo, ou mude API, você implementa um novo adapter (Whapi, Wozzapi, ou Evolution self-hosted como fallback) e migra os clientes em horas. **A abstração é o que torna a terceirização segura.**
