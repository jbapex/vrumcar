-- =====================================================================
-- CRM Automotivo SaaS — Schema PostgreSQL
-- Multi-tenant com Row Level Security
-- =====================================================================
-- Convenções:
--   - Todas as tabelas tenant-scoped têm organization_id NOT NULL
--   - PKs são UUID v4 gerados na aplicação (cuid2 também serve)
--   - Timestamps: created_at, updated_at (auto via trigger), deleted_at (soft delete opcional)
--   - Enums em UPPER_SNAKE_CASE
--   - Índices compostos sempre começam com organization_id
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- busca textual
CREATE EXTENSION IF NOT EXISTS "unaccent";  -- buscas sem acento

-- =====================================================================
-- 1. PLATAFORMA (super-admin do SaaS — NÃO tenant-scoped)
-- =====================================================================

CREATE TABLE platform_admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE plans (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               TEXT UNIQUE NOT NULL,           -- 'starter', 'pro', 'enterprise'
  name               TEXT NOT NULL,
  monthly_price_cents INT NOT NULL,
  yearly_price_cents  INT NOT NULL,
  max_users          INT NOT NULL,
  max_vehicles       INT NOT NULL,
  max_whatsapp_msgs  INT NOT NULL,                   -- por mês
  features           JSONB NOT NULL DEFAULT '{}',    -- feature flags
  is_public          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 2. ORGANIZAÇÕES (tenants) E USUÁRIOS
-- =====================================================================

CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  legal_name      TEXT,
  cnpj            TEXT,
  phone           TEXT,
  email           TEXT,
  address         JSONB,
  logo_url        TEXT,
  timezone        TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  status          TEXT NOT NULL DEFAULT 'ACTIVE',    -- ACTIVE, SUSPENDED, CANCELED
  trial_ends_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_status ON organizations(status);

CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id             UUID NOT NULL REFERENCES plans(id),
  status              TEXT NOT NULL,                 -- TRIALING, ACTIVE, PAST_DUE, CANCELED
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end   TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  external_id         TEXT,                          -- ID no Asaas/Stripe
  external_provider   TEXT,                          -- 'asaas' | 'stripe'
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  password_hash   TEXT,                              -- nullable pra OAuth-only
  email_verified  TIMESTAMPTZ,
  avatar_url      TEXT,
  totp_secret     TEXT,                              -- 2FA
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE accounts (  -- OAuth providers (Auth.js)
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          INT,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL
);

CREATE TYPE org_role AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE', 'VIEWER');

CREATE TABLE memberships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            org_role NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  invited_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_memberships_org ON memberships(organization_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);

CREATE TABLE invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            org_role NOT NULL,
  token           TEXT UNIQUE NOT NULL,
  invited_by      UUID NOT NULL REFERENCES users(id),
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 3. ESTOQUE DE VEÍCULOS
-- =====================================================================

CREATE TYPE vehicle_status AS ENUM (
  'DISPONIVEL', 'RESERVADO', 'VENDIDO', 'EM_PREPARACAO', 'EM_MANUTENCAO', 'INATIVO'
);
CREATE TYPE transmission AS ENUM ('MANUAL', 'AUTOMATICO', 'AUTOMATIZADO', 'CVT');
CREATE TYPE fuel_type AS ENUM ('GASOLINA', 'ETANOL', 'FLEX', 'DIESEL', 'GNV', 'ELETRICO', 'HIBRIDO');

CREATE TABLE vehicles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand               TEXT NOT NULL,
  model               TEXT NOT NULL,
  version             TEXT,
  year_model          INT NOT NULL,
  year_manufacture    INT NOT NULL,
  color               TEXT,
  km                  INT NOT NULL DEFAULT 0,
  transmission        transmission,
  fuel                fuel_type,
  doors               SMALLINT,
  plate               TEXT,
  chassis             TEXT,
  renavam             TEXT,
  fipe_code           TEXT,
  fipe_price_cents    BIGINT,
  fipe_updated_at     TIMESTAMPTZ,
  cost_price_cents    BIGINT,                        -- valor de entrada
  expenses_cents      BIGINT DEFAULT 0,              -- despesas
  sale_price_cents    BIGINT NOT NULL,               -- valor de venda
  min_price_cents     BIGINT,                        -- preço mínimo aceito
  description         TEXT,
  optionals           JSONB DEFAULT '[]',            -- ['ar', 'direção elétrica', ...]
  status              vehicle_status NOT NULL DEFAULT 'DISPONIVEL',
  acquired_at         DATE,
  sold_at             TIMESTAMPTZ,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_vehicles_org_status ON vehicles(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_org_created ON vehicles(organization_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_search ON vehicles USING gin (
  (organization_id::text || ' ' || coalesce(brand,'') || ' ' || coalesce(model,'') || ' ' || coalesce(version,'')) gin_trgm_ops
);
CREATE UNIQUE INDEX idx_vehicles_org_plate ON vehicles(organization_id, plate) WHERE plate IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE vehicle_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  thumb_url       TEXT,
  position        INT NOT NULL DEFAULT 0,
  is_cover        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicle_photos_vehicle ON vehicle_photos(vehicle_id, position);

CREATE TABLE vehicle_price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  old_price_cents BIGINT,
  new_price_cents BIGINT NOT NULL,
  reason          TEXT,
  changed_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicle_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,                     -- 'CRLV', 'LAUDO', 'NF_ENTRADA', etc.
  name            TEXT NOT NULL,
  url             TEXT NOT NULL,
  uploaded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 4. LEADS, CLIENTES E ORIGENS
-- =====================================================================

CREATE TABLE lead_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,                     -- 'Webmotors', 'Site', 'Indicação'
  type            TEXT NOT NULL,                     -- 'PORTAL', 'ORGANIC', 'PAID', 'REFERRAL', 'WALKIN'
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

CREATE TYPE lead_status AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST');

CREATE TABLE leads (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  phone                TEXT,
  email                TEXT,
  cpf                  TEXT,
  source_id            UUID REFERENCES lead_sources(id),
  source_external_id   TEXT,                         -- ID do lead no portal de origem
  interest_vehicle_id  UUID REFERENCES vehicles(id),
  interest_description TEXT,                         -- "Hilux SRX 2022 ou similar"
  notes                TEXT,
  status               lead_status NOT NULL DEFAULT 'NEW',
  score                INT NOT NULL DEFAULT 0,
  assigned_to          UUID REFERENCES users(id),
  customer_id          UUID,                         -- preenchido quando converte
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_interaction_at  TIMESTAMPTZ,
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX idx_leads_org_status ON leads(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_org_assigned ON leads(organization_id, assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_phone ON leads(organization_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_leads_cpf ON leads(organization_id, cpf) WHERE cpf IS NOT NULL;

CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  cpf             TEXT,
  rg              TEXT,
  birth_date      DATE,
  address         JSONB,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_customers_org ON customers(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_cpf ON customers(organization_id, cpf) WHERE cpf IS NOT NULL;

ALTER TABLE leads ADD CONSTRAINT fk_leads_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id);

CREATE TABLE tags (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  color           TEXT,
  UNIQUE(organization_id, name)
);

CREATE TABLE lead_tags (
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  tag_id  UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, tag_id)
);

CREATE TYPE interaction_type AS ENUM (
  'NOTE', 'CALL', 'EMAIL', 'WHATSAPP', 'VISIT', 'TEST_DRIVE', 'PROPOSAL', 'SYSTEM'
);

CREATE TABLE lead_interactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type            interaction_type NOT NULL,
  content         TEXT,
  metadata        JSONB,
  user_id         UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_interactions_lead ON lead_interactions(lead_id, created_at DESC);

-- =====================================================================
-- 5. PIPELINE / FUNIL DE VENDAS
-- =====================================================================

CREATE TABLE pipelines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id     UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  position        INT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'OPEN',      -- OPEN, WON, LOST
  color           TEXT,
  UNIQUE(pipeline_id, position)
);

CREATE TYPE deal_status AS ENUM ('OPEN', 'WON', 'LOST');

CREATE TABLE deals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id          UUID NOT NULL REFERENCES pipelines(id),
  stage_id             UUID NOT NULL REFERENCES pipeline_stages(id),
  lead_id              UUID NOT NULL REFERENCES leads(id),
  vehicle_id           UUID REFERENCES vehicles(id),
  title                TEXT NOT NULL,
  estimated_value_cents BIGINT,
  status               deal_status NOT NULL DEFAULT 'OPEN',
  lost_reason          TEXT,
  expected_close_date  DATE,
  closed_at            TIMESTAMPTZ,
  assigned_to          UUID REFERENCES users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deals_org_stage ON deals(organization_id, stage_id) WHERE status = 'OPEN';
CREATE INDEX idx_deals_org_assigned ON deals(organization_id, assigned_to);

-- =====================================================================
-- 6. WHATSAPP / MENSAGERIA
-- =====================================================================

CREATE TYPE wa_provider AS ENUM ('CLOUD_API', 'UAZAPI', 'EVOLUTION');
CREATE TYPE wa_instance_status AS ENUM ('CONNECTING', 'CONNECTED', 'DISCONNECTED', 'ERROR');

CREATE TABLE whatsapp_instances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,                   -- "Vendas SP", "Pós-venda"
  provider          wa_provider NOT NULL,
  phone_number      TEXT,
  display_name      TEXT,
  -- Cloud API
  phone_number_id   TEXT,
  business_id       TEXT,
  access_token      TEXT,                            -- criptografado
  -- uazapi
  uazapi_base_url   TEXT,                            -- ex: https://free.uazapi.com ou self-hosted
  uazapi_instance   TEXT,                            -- nome/id da instância na uazapi
  uazapi_token      TEXT,                            -- criptografado
  -- Evolution
  evolution_instance TEXT,                           -- nome da instância no Evolution
  status            wa_instance_status NOT NULL DEFAULT 'DISCONNECTED',
  last_error        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  instance_id         UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  contact_phone       TEXT NOT NULL,
  contact_name        TEXT,
  lead_id             UUID REFERENCES leads(id),
  assigned_to         UUID REFERENCES users(id),
  unread_count        INT NOT NULL DEFAULT 0,
  last_message_at     TIMESTAMPTZ,
  last_message_preview TEXT,
  is_closed           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(instance_id, contact_phone)
);

CREATE INDEX idx_conversations_org_assigned ON conversations(organization_id, assigned_to);
CREATE INDEX idx_conversations_org_last_msg ON conversations(organization_id, last_message_at DESC);

CREATE TYPE message_direction AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE message_status AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'LOCATION', 'TEMPLATE');

CREATE TABLE messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction           message_direction NOT NULL,
  type                message_type NOT NULL,
  content             TEXT,
  media_url           TEXT,
  media_mime          TEXT,
  status              message_status NOT NULL DEFAULT 'PENDING',
  external_id         TEXT,                          -- ID retornado pelo provider
  template_name       TEXT,
  error               TEXT,
  sent_by             UUID REFERENCES users(id),     -- null se automation
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at        TIMESTAMPTZ,
  read_at             TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE UNIQUE INDEX idx_messages_external ON messages(external_id) WHERE external_id IS NOT NULL;

CREATE TABLE message_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT,                              -- 'marketing', 'utility', 'service'
  language        TEXT NOT NULL DEFAULT 'pt_BR',
  body            TEXT NOT NULL,
  variables       JSONB DEFAULT '[]',
  cloud_api_name  TEXT,                              -- nome no Meta quando aprovado
  cloud_api_status TEXT,                             -- 'PENDING', 'APPROVED', 'REJECTED'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quick_replies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  shortcut        TEXT NOT NULL,                     -- "/preco"
  content         TEXT NOT NULL,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 7. AGENDAMENTOS / TEST DRIVE
-- =====================================================================

CREATE TYPE appointment_type AS ENUM ('VISIT', 'TEST_DRIVE', 'INSPECTION', 'DELIVERY', 'OTHER');
CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELED');

CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type            appointment_type NOT NULL,
  status          appointment_status NOT NULL DEFAULT 'SCHEDULED',
  lead_id         UUID REFERENCES leads(id),
  customer_id     UUID REFERENCES customers(id),
  vehicle_id      UUID REFERENCES vehicles(id),
  assigned_to     UUID REFERENCES users(id),
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_org_starts ON appointments(organization_id, starts_at);
CREATE INDEX idx_appointments_assigned ON appointments(assigned_to, starts_at);

CREATE TABLE test_drives (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id),
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
  lead_id         UUID REFERENCES leads(id),
  driver_name     TEXT NOT NULL,
  driver_cnh      TEXT,
  cnh_photo_url   TEXT,
  km_start        INT,
  km_end          INT,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 8. AUTOMAÇÕES
-- =====================================================================

CREATE TABLE automations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  trigger_type    TEXT NOT NULL,                     -- 'lead.created', 'cron', etc.
  trigger_config  JSONB NOT NULL DEFAULT '{}',
  steps           JSONB NOT NULL,                    -- array de steps {type, config, next}
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_automations_org_trigger ON automations(organization_id, trigger_type) WHERE is_active = true;

CREATE TYPE automation_run_status AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

CREATE TABLE automation_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  automation_id   UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  trigger_payload JSONB NOT NULL,
  status          automation_run_status NOT NULL DEFAULT 'PENDING',
  current_step    INT NOT NULL DEFAULT 0,
  steps_log       JSONB NOT NULL DEFAULT '[]',
  error           TEXT,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_runs_org_status ON automation_runs(organization_id, status, created_at DESC);

-- =====================================================================
-- 9. ANÚNCIOS / PORTAIS
-- =====================================================================

CREATE TYPE listing_status AS ENUM ('DRAFT', 'PUBLISHING', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ERROR');

CREATE TABLE listing_channels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,                     -- 'webmotors', 'olx', 'icarros', 'mercadolivre', 'site'
  name            TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  credentials     JSONB,                             -- criptografado
  config          JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  channel_id      UUID NOT NULL REFERENCES listing_channels(id) ON DELETE CASCADE,
  external_id     TEXT,
  external_url    TEXT,
  status          listing_status NOT NULL DEFAULT 'DRAFT',
  last_synced_at  TIMESTAMPTZ,
  last_error      TEXT,
  views           INT DEFAULT 0,
  leads_count     INT DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, vehicle_id)
);

CREATE INDEX idx_listings_org_status ON listings(organization_id, status);

CREATE TABLE listing_sync_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  listing_id      UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,                     -- 'create', 'update', 'pause', 'delete'
  success         BOOLEAN NOT NULL,
  request         JSONB,
  response        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 10. FINANCIAMENTO
-- =====================================================================

CREATE TABLE banks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  code            TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  config          JSONB,                             -- taxas, integração, etc.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE finance_simulations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id         UUID REFERENCES leads(id),
  vehicle_id      UUID REFERENCES vehicles(id),
  vehicle_value_cents BIGINT NOT NULL,
  down_payment_cents  BIGINT NOT NULL,
  installments    INT NOT NULL,
  results         JSONB NOT NULL,                    -- array de {bank, rate, installment, total}
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE finance_proposal_status AS ENUM ('DRAFT', 'SUBMITTED', 'IN_ANALYSIS', 'APPROVED', 'REJECTED', 'CONTRACTED', 'CANCELED');

CREATE TABLE finance_proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id         UUID REFERENCES leads(id),
  customer_id     UUID REFERENCES customers(id),
  vehicle_id      UUID REFERENCES vehicles(id),
  bank_id         UUID REFERENCES banks(id),
  status          finance_proposal_status NOT NULL DEFAULT 'DRAFT',
  vehicle_value_cents BIGINT NOT NULL,
  down_payment_cents  BIGINT NOT NULL,
  financed_value_cents BIGINT NOT NULL,
  installments    INT NOT NULL,
  installment_value_cents BIGINT NOT NULL,
  rate_monthly    NUMERIC(6,4),
  external_id     TEXT,
  result_payload  JSONB,
  submitted_at    TIMESTAMPTZ,
  decided_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 11. VENDAS, CONTRATOS, COMISSÕES
-- =====================================================================

CREATE TYPE payment_method AS ENUM ('CASH', 'FINANCING', 'TRADE_IN', 'CONSORTIUM', 'MIXED');
CREATE TYPE sale_status AS ENUM ('PENDING', 'COMPLETED', 'CANCELED');

CREATE TABLE sales (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vehicle_id          UUID NOT NULL REFERENCES vehicles(id),
  customer_id         UUID NOT NULL REFERENCES customers(id),
  deal_id             UUID REFERENCES deals(id),
  salesperson_id      UUID REFERENCES users(id),
  payment_method      payment_method NOT NULL,
  total_value_cents   BIGINT NOT NULL,
  cost_value_cents    BIGINT,
  profit_cents        BIGINT,
  trade_in_vehicle_id UUID REFERENCES vehicles(id),  -- carro recebido como troca
  trade_in_value_cents BIGINT,
  finance_proposal_id UUID REFERENCES finance_proposals(id),
  status              sale_status NOT NULL DEFAULT 'PENDING',
  closed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_org_closed ON sales(organization_id, closed_at DESC);
CREATE INDEX idx_sales_org_salesperson ON sales(organization_id, salesperson_id);

CREATE TABLE contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  template_id     UUID,
  pdf_url         TEXT,
  signed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contract_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  body            TEXT NOT NULL,                     -- handlebars
  is_default      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE commissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  rule            TEXT NOT NULL,                     -- 'PERCENT', 'FIXED', 'TIERED'
  percent         NUMERIC(5,2),
  amount_cents    BIGINT NOT NULL,
  paid            BOOLEAN NOT NULL DEFAULT false,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 12. NF-e
-- =====================================================================

CREATE TYPE invoice_status AS ENUM ('DRAFT', 'PROCESSING', 'AUTHORIZED', 'REJECTED', 'CANCELED');

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sale_id         UUID REFERENCES sales(id),
  series          INT NOT NULL,
  number          INT NOT NULL,
  type            TEXT NOT NULL,                     -- 'NFE', 'NFCE', 'VENDA_VEICULO'
  status          invoice_status NOT NULL DEFAULT 'DRAFT',
  external_id     TEXT,                              -- ID PlugNotas
  access_key      TEXT,                              -- chave de acesso 44 dígitos
  xml_url         TEXT,
  pdf_url         TEXT,
  total_cents     BIGINT NOT NULL,
  payload         JSONB NOT NULL,
  rejection_reason TEXT,
  authorized_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_org_status ON invoices(organization_id, status);

-- =====================================================================
-- 13. AUDITORIA E WEBHOOKS
-- =====================================================================

CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  action          TEXT NOT NULL,                     -- 'vehicle.created', 'lead.deleted'
  resource_type   TEXT,
  resource_id     UUID,
  ip              TEXT,
  user_agent      TEXT,
  before          JSONB,
  after           JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

CREATE TABLE webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source          TEXT NOT NULL,                     -- 'asaas', 'whatsapp_cloud', 'olx', etc.
  external_id     TEXT NOT NULL,                     -- pra idempotência
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL,
  processed       BOOLEAN NOT NULL DEFAULT false,
  processed_at    TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_webhook_events_source_external ON webhook_events(source, external_id);
CREATE INDEX idx_webhook_events_unprocessed ON webhook_events(source, created_at) WHERE processed = false;

-- =====================================================================
-- 14. CACHE FIPE (compartilhado entre tenants)
-- =====================================================================

CREATE TABLE fipe_brands (
  id        SERIAL PRIMARY KEY,
  vehicle_type TEXT NOT NULL,                        -- 'cars', 'bikes', 'trucks'
  code      TEXT NOT NULL,
  name      TEXT NOT NULL,
  UNIQUE(vehicle_type, code)
);

CREATE TABLE fipe_models (
  id        SERIAL PRIMARY KEY,
  brand_id  INT NOT NULL REFERENCES fipe_brands(id),
  code      TEXT NOT NULL,
  name      TEXT NOT NULL,
  UNIQUE(brand_id, code)
);

CREATE TABLE fipe_prices (
  id            SERIAL PRIMARY KEY,
  model_id      INT NOT NULL REFERENCES fipe_models(id),
  year_code     TEXT NOT NULL,
  fuel          TEXT,
  price_cents   BIGINT NOT NULL,
  reference     TEXT NOT NULL,                       -- mês de referência
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(model_id, year_code, reference)
);

-- =====================================================================
-- 15. TRIGGERS — updated_at automático
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'updated_at' AND table_schema = 'public'
  LOOP
    EXECUTE format('
      CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    ', r.table_name);
  END LOOP;
END $$;

-- =====================================================================
-- 16. ROW LEVEL SECURITY
-- =====================================================================
-- A aplicação seta SET app.current_org_id = '<uuid>' no início de cada
-- transação. As policies abaixo garantem isolamento mesmo se o código
-- esquecer de filtrar por organization_id.

-- Helper
CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- Habilitar RLS em todas as tabelas tenant-scoped
DO $$
DECLARE tables TEXT[] := ARRAY[
  'subscriptions', 'memberships', 'invitations',
  'vehicles', 'vehicle_photos', 'vehicle_price_history', 'vehicle_documents',
  'lead_sources', 'leads', 'customers', 'tags', 'lead_interactions',
  'pipelines', 'pipeline_stages', 'deals',
  'whatsapp_instances', 'conversations', 'messages', 'message_templates', 'quick_replies',
  'appointments', 'test_drives',
  'automations', 'automation_runs',
  'listing_channels', 'listings', 'listing_sync_logs',
  'banks', 'finance_simulations', 'finance_proposals',
  'sales', 'contracts', 'contract_templates', 'commissions',
  'invoices', 'audit_logs'
];
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('
      CREATE POLICY tenant_isolation ON %I
      USING (organization_id = current_org_id())
      WITH CHECK (organization_id = current_org_id());
    ', t);
  END LOOP;
END $$;

-- =====================================================================
-- FIM
-- =====================================================================
