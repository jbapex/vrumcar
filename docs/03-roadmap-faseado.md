# Roadmap faseado — CRM Automotivo SaaS

> 5 fases, do zero ao SaaS público. Estimativas considerando você desenvolvendo solo com Cursor, em ritmo de **dedicação alta** (20-30h/semana). Multiplique por 2 se for meio-período.

---

## Visão geral das fases

| Fase | Foco | Duração estimada | Resultado |
|---|---|---|---|
| **0** | Fundação | 1-2 semanas | Projeto rodando local com auth + multi-tenancy |
| **1** | Core CRM | 4-6 semanas | Estoque + leads + funil + WhatsApp básico funcionando na sua loja |
| **2** | Automações + integrações | 6-8 semanas | Motor de automações, FIPE, portais, financiamento |
| **3** | Vendas, NF-e e relatórios | 4-6 semanas | Ciclo completo de venda fechada com nota |
| **4** | SaaS público | 4-6 semanas | Billing, onboarding, painel de plataforma, marketing site |

**Total realista: 5-7 meses** pra ter algo vendável. Considere mais 2-3 meses pros primeiros clientes pagantes ajustarem o produto.

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

## Fase 2 — Automações + integrações (6-8 semanas)

Aqui o produto vira "CRM de verdade". Cada item dessa fase agrega muito valor percebido.

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

### 2.2 Motor de automações
- [ ] Schema de `automations` e `automation_runs`
- [ ] Engine que processa steps em fila BullMQ
- [ ] Triggers: `lead.created`, `lead.stage_changed`, `lead.no_response_for`, `cron`, `appointment.scheduled`
- [ ] Actions: `send_whatsapp`, `send_email`, `create_task`, `change_stage`, `add_tag`, `wait`, `condition`
- [ ] UI inicial: formulário (deixe React Flow pra v2)
- [ ] Logs de execução visíveis na UI
- [ ] Templates de automação prontos (boas-vindas, follow-up 24h, no-show, etc.)

### 2.3 FIPE
- [ ] Job mensal sincronizando marcas/modelos/preços pro cache local
- [ ] Endpoint `/api/fipe/lookup?brand=&model=&year=`
- [ ] Botão "Buscar FIPE" no cadastro de veículo
- [ ] Atualização semanal do `fipe_price_cents` dos veículos em estoque

### 2.4 Portais — comece pelo mais fácil
- [ ] **Mercado Livre** primeiro (API mais moderna e documentada): OAuth, criar/atualizar/pausar anúncio, webhook de perguntas
- [ ] **OLX** depois (API com contrato): mesma estrutura
- [ ] **Webmotors via feed XML**: gerar XML público em `/feed/webmotors/[orgSlug].xml` com os veículos da org
- [ ] **iCarros via feed**: similar
- [ ] Dashboard de status dos anúncios por veículo

### 2.5 Financiamento (versão 1)
- [ ] CRUD de bancos parceiros e taxas vigentes
- [ ] Tela de simulação multi-banco (cálculo local com tabela Price)
- [ ] Geração de PDF de simulação
- [ ] Cadastro manual de proposta
- [ ] **Integração Creditas** como primeira API real
- [ ] Webhook Creditas pra atualizar status

### 2.6 Régua de relacionamento (pós-venda básico)
- [ ] Automações pré-configuradas: 7d, 30d, 90d após venda
- [ ] Aniversário do cliente
- [ ] Lembrete de revisão

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

## Fase 5+ (futuro) — não comece já

- App PWA mobile-first otimizado
- Mais financeiras (Santander, BV, Bradesco)
- Assinatura digital de contratos (D4Sign, ClickSign, ZapSign)
- IA: sugestão de resposta no WhatsApp, geração automática de descrição, lead scoring inteligente
- BI avançado com Metabase embutido
- Marketplace de templates de automação
- API pública pra clientes integrarem
- White-label completo (subdomínio próprio do cliente)
- App de vistoria veicular
- Integração com gateways de pagamento (cliente paga sinal direto)

---

## Princípios de execução

1. **Não pule a Fase 0.** Toda hora de debug de tenant vazado em produção é por causa de fundação ruim.
2. **Use você mesmo na sua loja** desde a Fase 1. É a única forma de saber o que importa.
3. **Não venda na Fase 1 nem 2.** Você não tem produto ainda. Vai gastar 80% do tempo em suporte e 20% em código.
4. **Primeiros clientes pagantes só depois da Fase 4** — e mesmo assim, no máximo 5 lojas pagando R$ 99 cada nos primeiros 3 meses, pra dar tempo de ajustar.
5. **Cobre antes de ter tudo.** Se chegou na Fase 4 e tem 3 lojas dispostas a pagar, comece. Não espere ter "tudo perfeito". Nunca vai estar.
6. **Mate features.** Quando bater o impulso de adicionar algo, pergunte: "Algum cliente pediu isso pagando?" Se não, pra backlog.
