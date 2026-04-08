# Decisões arquiteturais do VrumCar

Este arquivo registra decisões importantes tomadas durante o desenvolvimento,
para referência futura. Cada decisão segue o formato: data, contexto,
decisão, consequência.

## Histórico

### 2025-XX-XX — Stack base
**Contexto**: Escolha inicial de stack para um CRM multi-tenant SaaS.
**Decisão**: Next.js 15 + TypeScript + PostgreSQL + Prisma + Auth.js v5 +
BullMQ + Redis + MinIO, rodando em Docker Compose na VPS própria.
**Consequência**: Controle total, sem vendor lock-in, type-safety ponta
a ponta. Trade-off: setup inicial mais trabalhoso que Supabase.

### 2025-XX-XX — WhatsApp com múltiplos providers
**Contexto**: Necessidade de suportar diferentes clientes com preferências
e orçamentos diferentes de WhatsApp.
**Decisão**: Abstração de provider com 3 adapters disponíveis — uazapi
(default recomendado, stateless), Cloud API (oficial Meta, pra disparos),
Evolution (self-hosted, pra quem quer custo zero).
**Consequência**: Flexibilidade máxima, zero lock-in com fornecedor
único de WhatsApp.
