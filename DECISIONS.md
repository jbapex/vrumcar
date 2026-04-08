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

### 2025-XX-XX — Prisma 5.22 em vez de Prisma 7
**Contexto**: O Prisma 7 tem mudanças incompatíveis (URL fora do
schema.prisma, novo formato de cliente). O .cursorrules e a
especificação foram escritos pensando em Prisma 5.
**Decisão**: Fixar Prisma 5.22 explicitamente em prisma e
@prisma/client.
**Consequência**: Estabilidade pro desenvolvimento atual. Migrar
pra Prisma 7 fica como tarefa futura quando o ecosystem amadurecer.

### 2025-XX-XX — Membership.invitedById sem relation reversa
**Contexto**: A relation reversa membershipInvites no User polui
o schema sem benefício real (nunca consultaríamos "quais memberships
esse user convidou").
**Decisão**: Manter invitedById como campo String simples, sem
relation Prisma. Buscar o user que convidou via query manual quando
necessário.
**Consequência**: Schema mais limpo, IntelliSense menos poluído.
Custo: queries que envolvem o convidador precisam de join manual.
