# Roadmap faseado — VrumCar CRM

> 6 fases, do zero ao SaaS público. Estimativas considerando desenvolvimento solo com Cursor, em ritmo de **dedicação alta** (20-30h/semana). Multiplique por 2 se for meio-período.

---

## Tese do produto (resumo)

O VrumCar existe pra **dobrar o faturamento de lojas de carros**. Não é um CRM genérico — é um sistema que:

1. Responde leads instantaneamente (humano ou IA)
2. Faz follow-up que nunca esquece
3. Unifica todos os canais num inbox só
4. Usa IA como pilar, não como enfeite
5. Dá ao dono visibilidade em tempo real da performance da equipe

Tudo no roadmap serve uma dessas alavancas. O que não serve, não entra.

---

## Visão geral das fases

| Fase | Foco | Duração estimada | Resultado |
|---|---|---|---|
| **0** | Fundação | 1-2 semanas | Projeto rodando com auth + multi-tenancy + RBAC |
| **1** | Core CRM | 4-6 semanas | Estoque + leads + funil + inbox WhatsApp + agenda |
| **2** | Automações + IA assistente | 6-8 semanas | Motor de automações, IA Nível 1 e 3, FIPE, portais, financiamento |
| **2.5** | IA avançada + canais extras | 4-6 semanas | IA Nível 2 (auto-resposta), Instagram/Messenger, dashboard de resposta |
| **3** | Vendas, NF-e e relatórios | 4-6 semanas | Ciclo completo de venda fechada com nota |
| **4** | SaaS público | 4-6 semanas | Billing, onboarding, painel de plataforma, marketing site |

**Total realista**: **7-9 meses** pra ter algo vendável completo. Considere mais 2-3 meses pros primeiros clientes pagantes ajustarem o produto.

**Caminho mais curto** (pular Fase 2.5 e adiar Fase 4): **5-7 meses** pra ter o sistema rodando na loja do design partner + 1-2 lojas piloto. IA avançada e SaaS público entram depois.

---

## Fase 0 — Fundação (1-2 semanas)

Esta fase é tediosa mas **CRÍTICA**. Não pule. Cada hora investida aqui economiza 10 depois.

### Entregáveis
- [ ] Repositório Git inicializado, `.cursorrules` configurado
- [ ] Next.js 15 + TS + ESLint + Prettier rodando
- [ ] Docker Compose com Postgres + Redis + MinIO funcionando local
- [ ] Prisma instalado, schema base com `Organization`, `User`, `Membership`, `Plan`, `Subscription`
- [ ] Tenant helper `getTenantPrisma(orgId)` testado
- [ ] Auth.js v5 configurado: e-mail/senha + magic link
- [ ] Fluxo completo: signup → cria org → cria membership OWNER → login → acesso ao dashboard
- [ ] Layout base com sidebar e navegação por organização (`/[orgSlug]/...`)
- [ ] BullMQ configurado, primeiro job de teste rodando
- [ ] Sentry instalado
- [ ] Deploy inicial na VPS (mesmo que só "hello world") via Docker Compose + Caddy
- [ ] CI no GitHub Actions: lint, typecheck, build em PR
- [ ] README com instruções de setup local

### Decisões a tomar agora
- Nome do produto e domínio
- shadcn/ui como base de componentes (recomendado)
- Estratégia de subdomínios vs path: `loja.app.com` ou `app.com/loja`? **Recomendo path no MVP** (`/[orgSlug]`), simplifica MUITO o deploy.

---

## Fase 1 — Core CRM (4-6 semanas)

O coração do produto. No fim desta fase você já usa o sistema na sua loja real, mesmo sem automações.

### 1.1 Estoque de veículos
- [ ] CRUD completo de veículos
- [ ] Upload de fotos pro MinIO (drag-and-drop, ordenação, capa)
- [ ] Resize automático com Sharp em worker
- [ ] Listagem com filtros (marca, modelo, ano, status, preço)
- [ ] Busca textual (pg_trgm)
- [ ] Histórico de preço
- [ ] Documentos do veículo
- [ ] Cálculo de margem/lucro

### 1.2 Leads
- [ ] CRUD de leads
- [ ] Cadastro manual + via formulário público (`/api/public/leads/[orgSlug]`)
- [ ] Origens de lead configuráveis
- [ ] Atribuição manual e automática (round-robin)
- [ ] Timeline de interações
- [ ] Tags
- [ ] Deduplicação por telefone/CPF

### 1.3 Pipeline / Funil
- [ ] CRUD de pipelines e etapas
- [ ] Visualização Kanban com drag-and-drop (dnd-kit)
- [ ] Criar deal a partir de lead
- [ ] Mover deal entre etapas
- [ ] Marcar como ganho/perdido com motivo

### 1.4 Inbox WhatsApp (uazapi como primeiro provider)
- [ ] Cadastrar instância uazapi (base URL, token) na UI de configurações
- [ ] Receber mensagens via webhook → criar/atualizar conversation
- [ ] UI de inbox estilo WhatsApp Web (lista de conversas + chat)
- [ ] Envio de texto, imagem, áudio
- [ ] Vincular conversation a lead automaticamente (por telefone)
- [ ] Atribuir conversation a vendedor
- [ ] Atalhos rápidos
- [ ] Notificação visual de nova mensagem

> **Por que começar pela uazapi e não pela Evolution self-hosted?** Porque na uazapi você não precisa subir container, configurar volume persistente, lidar com sessão corrompendo, nem se preocupar com QR code. Você cria conta, gera token, cola no CRM e começa a testar. Evolution entra na Fase 2 como segundo provider pra quem quiser custo zero. Cloud API entra também na Fase 2 pros casos que exigem oficial.

### 1.5 Agendamentos
- [ ] CRUD de appointment
- [ ] Visualização semanal/diária
- [ ] Detecção de conflito
- [ ] Vinculação a lead/veículo

### 1.6 Configurações básicas
- [ ] Dados da org (nome, logo, etc.)
- [ ] Convidar usuários (e-mail com token)
- [ ] Gestão de papéis
- [ ] Origens de lead
- [ ] Pipelines e etapas

### Marco
**Você roda isso na sua loja por 2 semanas antes de passar pra Fase 2.** Anota tudo que dói. Esse feedback é ouro.

---

## Fase 2 — Automações + IA assistente + integrações (6-8 semanas)

Aqui o produto vira "CRM que dobra faturamento". É nesta fase que as **alavancas 1, 2 e 6** da tese do produto entram em produção.

### 2.1 WhatsApp — providers adicionais (Cloud API + Evolution)
- [ ] Adapter `cloud-api.ts` implementando a interface comum
- [ ] UI pra configurar phone_number_id, business_id, access_token
- [ ] Verificação de webhook do Meta
- [ ] CRUD de templates HSM, sincronização de status com Meta
- [ ] Envio de template com variáveis
- [ ] Recebimento via webhook do Meta (status, mensagens)
- [ ] Adapter `evolution.ts` implementando a interface comum
- [ ] Container Evolution API opcional no docker-compose (documentado, não default)
- [ ] Conectar instância Evolution via QR code (UI)
- [ ] Toggle por instância: usuário escolhe uazapi, Cloud API ou Evolution
- [ ] UI deixa claro os trade-offs de cada provider no momento da escolha

> **Por que Cloud API nesta fase?** Porque desbloqueia Instagram Direct e Facebook Messenger na Fase 2.5 (mesmo OAuth do Meta Business). Um investimento de config única, três canais de retorno.

### 2.2 Motor de automações (o coração da Fase 2)
- [ ] Schema de `automations`, `automation_runs`, `automation_templates`
- [ ] Engine que processa steps em fila BullMQ com retry e idempotência
- [ ] **Triggers** expandidos:
  - [ ] `lead.created`
  - [ ] `lead.stage_changed`
  - [ ] `lead.no_response_for` (vendedor não respondeu)
  - [ ] `lead.customer_no_response_for` (cliente não respondeu)
  - [ ] `lead.cold` (N dias inativo)
  - [ ] `vehicle.created`
  - [ ] `vehicle.price_changed`
  - [ ] `vehicle.stuck_in_stock` (parado >X dias)
  - [ ] `appointment.scheduled`
  - [ ] `appointment.no_show`
  - [ ] `deal.won` / `deal.lost`
  - [ ] `sale.completed`
  - [ ] `customer.birthday`
  - [ ] `customer.purchase_anniversary`
  - [ ] `cron`
- [ ] **Actions** expandidas:
  - [ ] `send_whatsapp` (template HSM ou texto livre)
  - [ ] `send_instagram` / `send_messenger` (Fase 2.5)
  - [ ] `send_email`
  - [ ] `create_task`
  - [ ] `escalate_lead` (reatribuir)
  - [ ] `notify_owner` (push + WhatsApp pessoal do dono)
  - [ ] `change_stage`
  - [ ] `assign_user`
  - [ ] `add_tag` / `remove_tag`
  - [ ] `call_webhook`
  - [ ] `wait` (delay)
  - [ ] `condition` (if/else)
  - [ ] `invoke_ai` (Fase 2.4)
- [ ] UI inicial: formulário (React Flow fica pra v2)
- [ ] Logs de execução visíveis na UI com payload completo
- [ ] **10 templates prontos instalados por padrão** em toda org nova:
  1. Resposta imediata a lead novo (escalonamento em 5/15min)
  2. Follow-up lead cliente sem resposta 24h
  3. Follow-up lead cliente sem resposta 3d (com IA)
  4. Follow-up lead cliente sem resposta 7d (última tentativa)
  5. Lead frio 15d → arquivar
  6. Alerta de carro parado 60d
  7. Divulgação automática de carro novo (match com leads antigos)
  8. Régua pós-venda (3d / 30d / 90d / 180d / 365d)
  9. Aniversário do cliente
  10. Reativação 2 anos pós-compra

### 2.3 FIPE
- [ ] Job mensal sincronizando marcas/modelos/preços pro cache local
- [ ] Endpoint `/api/fipe/lookup?brand=&model=&year=`
- [ ] Botão "Buscar FIPE" no cadastro de veículo
- [ ] Atualização semanal do `fipe_price_cents` dos veículos em estoque

### 2.4 IA — Nível 1 e Nível 3 (diferenciação competitiva do produto)

**Infraestrutura base de IA:**
- [ ] Schema: `ai_settings`, `ai_prompts`, `ai_executions`, `ai_knowledge_base`, `ai_guardrails`
- [ ] Serviço `src/lib/ai/claude.ts` — cliente Anthropic com logging, retry, rate limit
- [ ] Serviço `src/lib/ai/context-builder.ts` — monta contexto (lead + conversa + veículo + KB da loja)
- [ ] Sistema de salvaguardas (`guardrails`) que valida output antes de enviar
- [ ] Tracking de custo por execução (input tokens × output tokens × preço do modelo)
- [ ] Dashboard de uso de IA por org (custo mensal, features mais usadas)

**Nível 1 — Assistente do vendedor:**
- [ ] Botão "Sugerir resposta" no inbox → gera 2-3 sugestões baseadas no histórico
- [ ] Botão "Gerar descrição" no cadastro de veículo → texto pronto pra anúncio
- [ ] Botão "Resumir conversa" → resumo em 3 linhas
- [ ] Botão "Extrair dados do lead" → preenche campos automaticamente a partir de texto livre
- [ ] Feedback humano: vendedor pode aprovar/editar/rejeitar cada sugestão (vira training data)

**Nível 3 — Qualificação automática de leads:**
- [ ] Trigger: `lead.created` com origem configurada (ex: portal, formulário web)
- [ ] IA faz 3-5 perguntas sequenciais configuráveis por loja
- [ ] Respostas são salvas no lead como metadata estruturada
- [ ] Lead "qualificado" entra no pipeline com tag automática + notificação pro vendedor
- [ ] Lead "não qualificado" entra em régua de follow-up automático
- [ ] Tela de configuração: quais perguntas, em que ordem, quando encerrar

### 2.5 Portais — comece pelo mais fácil
- [ ] **Mercado Livre** primeiro (API mais moderna e documentada): OAuth, criar/atualizar/pausar anúncio, webhook de perguntas
- [ ] **OLX** depois (API com contrato): mesma estrutura
- [ ] **Webmotors via feed XML**: gerar XML público em `/feed/webmotors/[orgSlug].xml` com os veículos da org
- [ ] **iCarros via feed**: similar
- [ ] Dashboard de status dos anúncios por veículo
- [ ] Leads chegando de portais entram automaticamente no pipeline + disparam qualificação IA (Nível 3)

### 2.6 Financiamento (versão 1)
- [ ] CRUD de bancos parceiros e taxas vigentes
- [ ] Tela de simulação multi-banco (cálculo local com tabela Price)
- [ ] Geração de PDF de simulação com identidade visual da loja
- [ ] Cadastro manual de proposta
- [ ] **Integração Creditas** como primeira API real
- [ ] Webhook Creditas pra atualizar status
- [ ] Envio automático de proposta pelo WhatsApp (com link pro PDF)

### Marco da Fase 2
Ao final da Fase 2, uma loja real consegue operar o dia inteiro sem precisar de nada externo: lead entra, é qualificado por IA, atribuído ao vendedor, responde via WhatsApp com ajuda da IA, agenda visita, gera proposta, fecha venda. **Este é o momento onde o produto realmente "vale o preço mensal".**

---

## Fase 2.5 — IA avançada + canais extras (4-6 semanas, OPCIONAL)

Esta fase é **opcional**. Pode ser feita após a Fase 2 (recomendado) ou adiada pra depois da Fase 3. É onde as **alavancas 3 e 1 em modo extremo** entram: resposta automática mesmo à noite e unificação de todos os canais.

> **Por que é opcional:** as features desta fase são as mais ambiciosas e arriscadas. IA respondendo automaticamente exige afinação de prompt cuidadosa pra não falar besteira. Instagram/Messenger exigem burocracia do Meta Business. Se o objetivo é lançar SaaS público rápido, pode adiar. Se o objetivo é **matar a concorrência**, faz agora.

### 2.5.1 IA — Nível 2 (resposta automática fora do horário)
- [ ] Configuração de horários de auto-reply por organização
- [ ] Engine que detecta mensagem fora do horário e aciona IA após delay configurável
- [ ] Prompt base específico pra auto-reply (salvaguardas mais rígidas)
- [ ] Base de conhecimento estruturada (horário, endereço, políticas, etc) alimenta o contexto
- [ ] Detecção de intenção "quero falar com humano" → encaminha imediatamente
- [ ] IA **nunca** fala preço que não tá no estoque em tempo real
- [ ] IA **nunca** promete desconto ou condição especial
- [ ] IA **sempre** se identifica como assistente virtual
- [ ] Dashboard "conversas tratadas pela IA à noite" pro vendedor revisar de manhã
- [ ] Métricas: taxa de conversão de leads que foram atendidos pela IA vs humano
- [ ] Beta test obrigatório com design partner antes de liberar pra outras lojas

### 2.5.2 Instagram Direct
- [ ] OAuth com Meta Business (aproveita o fluxo já feito pro WhatsApp Cloud API)
- [ ] Webhook pra receber mensagens
- [ ] Envio de mensagens (texto, mídia)
- [ ] Integração com inbox unificado
- [ ] Matching automático de cliente cross-canal (mesmo perfil no WhatsApp e Instagram)

### 2.5.3 Facebook Messenger
- [ ] Mesmo padrão do Instagram (OAuth Meta Business compartilhado)
- [ ] Webhook, envio, inbox

### 2.5.4 Dashboard de resposta em tempo real (alavanca 5)
- [ ] Tela especial pro dono com métricas ao vivo
- [ ] Leads aguardando primeira resposta (com tempo decorrido colorido)
- [ ] Conversas abertas por vendedor
- [ ] Tempo médio de resposta por vendedor (24h / 7d / 30d)
- [ ] Taxa de resposta em 5min / 15min / 1h
- [ ] Ranking de vendedores
- [ ] Alertas em tempo real: "Lead há 12min sem resposta", "Vendedor com 8 conversas abertas e média de resposta 45min"
- [ ] Notificação push pro celular do dono quando SLA é violado
- [ ] Configuração de SLA por canal (ex: WhatsApp 5min, email 2h, Instagram 15min)

### 2.5.5 Inbox unificado multi-canal
- [ ] UI consolidada mostrando WhatsApp + Instagram + Messenger na mesma lista de conversas
- [ ] Filtros por canal, vendedor, status, tags
- [ ] Timeline unificada por cliente (todas as conversas cross-canal ordenadas por data)
- [ ] Tempo de resposta visível por conversa com cor (verde < 5min, amarelo < 1h, vermelho > 1h)
- [ ] Notificação agressiva de nova mensagem (som + push + badge)
- [ ] Atalhos rápidos globais (servem pra qualquer canal)

### Marco da Fase 2.5
Sistema responde **automaticamente** leads que chegam de madrugada. Todos os canais estão num inbox só. Dono vê em tempo real quem tá respondendo rápido e quem tá enrolando. **Este é o produto que literalmente dobra faturamento.**

---

## Fase 3 — Vendas, NF-e e relatórios (4-6 semanas)

Fechar o ciclo completo: do lead ao fiscal.

### 3.1 Vendas e contratos
- [ ] Tela de fechamento de venda
- [ ] Suporte a troca (trade-in) com cadastro do veículo recebido
- [ ] Cálculo automático de comissão por regra
- [ ] Templates de contrato em handlebars
- [ ] Geração de PDF do contrato
- [ ] Atualização automática do status do veículo pra `VENDIDO`

### 3.2 NF-e via PlugNotas
- [ ] UI pra subir certificado A1 da org (criptografado)
- [ ] Endpoint que monta payload e chama PlugNotas
- [ ] Worker que processa fila de emissão e atualiza status
- [ ] Webhook PlugNotas → atualizar status, salvar XML/PDF
- [ ] Cancelamento e carta de correção

### 3.3 Relatórios
- [ ] Dashboard principal: leads do mês, vendas do mês, ticket médio, conversão, top vendedores, veículos parados >60d
- [ ] Funil de conversão por etapa
- [ ] Performance por vendedor
- [ ] Performance por origem
- [ ] Giro de estoque
- [ ] Exportação CSV
- [ ] Filtros por período

### 3.4 Auditoria e LGPD
- [ ] Audit log automático em todas as ações sensíveis
- [ ] Tela de visualização de auditoria pra admins
- [ ] Endpoint de exportação de dados pessoais (LGPD)
- [ ] Endpoint de exclusão LGPD com soft delete + job de hard delete

---

## Fase 4 — SaaS público (4-6 semanas)

Transformação de "ferramenta interna" em "produto vendável".

### 4.1 Billing com Asaas
- [ ] CRUD de planos no painel de plataforma
- [ ] Integração Asaas: criar customer, criar subscription, processar webhook
- [ ] Tela de billing dentro da org: plano atual, faturas, método de pagamento
- [ ] Trial de 14 dias automático no signup
- [ ] Bloqueio gradual quando trial expira ou pagamento atrasa (avisos → modo somente leitura → suspensão)
- [ ] Limites por plano: usuários, veículos, mensagens WhatsApp/mês
- [ ] Upgrade/downgrade de plano
- [ ] Cupons de desconto

### 4.2 Onboarding
- [ ] Fluxo de signup com criação de organização
- [ ] Wizard inicial: dados da loja → primeiro vendedor → primeiro veículo → conectar WhatsApp
- [ ] Tour guiado (driver.js ou intro.js)
- [ ] Templates pré-configurados (pipelines, automações, mensagens) ao criar org

### 4.3 Painel de plataforma (`/platform`)
- [ ] Login separado pra `platform_admins`
- [ ] Lista de organizações com filtros (plano, status, MRR)
- [ ] Métricas globais: MRR, churn, leads criados, mensagens, storage usado
- [ ] Impersonação com auditoria
- [ ] Gestão de planos
- [ ] Logs centralizados por org

### 4.4 Site de marketing
- [ ] Landing page (Next.js, mesma codebase ou separada)
- [ ] Página de planos
- [ ] Página de recursos
- [ ] Blog (opcional, MDX)
- [ ] FAQ e Central de Ajuda
- [ ] Documentação do produto
- [ ] Política de privacidade e termos de uso

### 4.5 Suporte
- [ ] Widget de chat (Crisp, Tawk ou próprio)
- [ ] Central de ajuda com artigos
- [ ] Form de contato
- [ ] E-mails transacionais bonitos (React Email)

### 4.6 Observabilidade pronta pra escala
- [ ] Sentry com source maps em produção
- [ ] Logs estruturados em JSON enviados pro Better Stack
- [ ] Métricas de negócio (Posthog ou caseiro)
- [ ] Uptime monitoring
- [ ] Alertas no Slack/Telegram pra: erro de billing, integração quebrada, fila travada, deploy falhado

---

## Fase 5+ (futuro) — depois do SaaS público

### IA avançada (Níveis 4 e 5)
- **IA Nível 4 — Agente autônomo de follow-up**: agente em background que decide sozinho quando abordar leads frios, qual mensagem usar, quando desistir. Roda com supervisão humana configurável.
- **IA Nível 5 — Conversacional operando o CRM**: "oi VrumCar, quantos Civics vendi esse mês?" e a IA navega o sistema pra responder. Integração com MCP ou tool calling nativo do Claude.
- **Lead scoring preditivo**: modelo que aprende com histórico de fechamentos da loja e prediz probabilidade de conversão de cada lead novo.
- **Geração de anúncio com imagem**: IA pega as fotos do carro + dados técnicos e gera anúncio completo (texto + layout) pronto pra publicar.

### Integrações expandidas
- Mais financeiras: Santander, BV, Bradesco, Itaú, Pan, Omni, Sinosserra
- Assinatura digital de contratos (D4Sign, ClickSign, ZapSign)
- Integração com gateways de pagamento (cliente paga sinal direto)
- API pública pra clientes integrarem com outros sistemas

### Produto avançado
- App PWA mobile-first otimizado pra vendedor em loja
- App nativo iOS/Android (se realmente valer a pena)
- BI avançado com Metabase ou Looker embutido
- Marketplace de templates de automação (comunidade)
- White-label completo (subdomínio próprio do cliente)
- App de vistoria veicular (tirar foto de 360°, checklist de avaliação de troca)

---

## Princípios de execução

1. **Não pule a Fase 0.** Toda hora de debug de tenant vazado em produção é por causa de fundação ruim.
2. **Use você mesmo na sua loja** desde a Fase 1. É a única forma de saber o que importa.
3. **Não venda na Fase 1 nem 2.** Você não tem produto ainda. Vai gastar 80% do tempo em suporte e 20% em código.
4. **Primeiros clientes pagantes só depois da Fase 4** — e mesmo assim, no máximo 5 lojas pagando R$ 99 cada nos primeiros 3 meses, pra dar tempo de ajustar.
5. **Cobre antes de ter tudo.** Se chegou na Fase 4 e tem 3 lojas dispostas a pagar, comece. Não espere ter "tudo perfeito". Nunca vai estar.
6. **Mate features.** Quando bater o impulso de adicionar algo, pergunte: "Algum cliente pediu isso pagando?" Se não, pra backlog.
