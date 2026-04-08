# Guia para usar Cursor neste projeto

> Esse arquivo é o que faz a diferença entre um projeto que vira lasanha em 3 meses e um projeto que cresce limpo. Leve a sério.

---

## Como usar este guia

1. Copie o conteúdo da seção **`.cursorrules`** abaixo pro arquivo `.cursorrules` na raiz do projeto.
2. Antes de cada módulo novo, abra o arquivo `01-especificacao-tecnica.md` e cole no chat do Cursor o trecho do módulo que vai construir, junto com o **prompt-template** correspondente.
3. **Sempre prefira pedir pequeno e iterar** a pedir tudo de uma vez. O Cursor erra mais quando você diz "implementa o módulo de leads inteiro". Ele acerta muito mais quando você diz "cria a tabela `leads` no Prisma e o endpoint POST /leads".

---

## Arquivo `.cursorrules` (cole na raiz do projeto)

```markdown
# CRM Automotivo SaaS - Regras do projeto

Você está trabalhando em um CRM multi-tenant para lojas de automóveis, projetado como SaaS desde o início.

## Stack
- Next.js 15 (App Router, Server Actions)
- TypeScript estrito (strict, noUncheckedIndexedAccess)
- PostgreSQL 16 + Prisma 5
- Auth.js v5 (NextAuth)
- BullMQ + Redis pra filas
- MinIO (S3-compatible) pra arquivos
- shadcn/ui + Tailwind CSS v4
- Zod pra validação
- Vitest pra testes

## Princípios INEGOCIÁVEIS

### 1. Multi-tenancy
- TODA tabela de domínio tem `organizationId`. Nunca criar tabela sem isso (exceto cache global tipo `fipe_*` e tabelas de plataforma).
- TODA query Prisma de domínio passa por `getTenantPrisma(orgId)`, NUNCA chama `prisma` direto em código de feature.
- TODA Server Action e Route Handler começa validando `session.activeOrgId` e checando permissões via `assertCan(user, 'resource', 'action')`.
- Webhooks externos identificam a org via campo no payload OU mapeamento por instância (ex: `whatsapp_instances.id` → `organization_id`).

### 2. Segurança
- Senhas: bcrypt cost 12.
- Credenciais de integração: AES-256-GCM via `lib/crypto.ts` com chave em `ENCRYPTION_KEY`.
- Nunca logar tokens, senhas, ou conteúdo de mensagens completas.
- Toda mutation valida input com Zod ANTES de tocar no banco.
- Audit log automático em ações sensíveis (criar/editar/deletar veículo, lead, deal, sale, user).

### 3. Background jobs
- Toda chamada a API externa vai pra fila BullMQ. Nunca dentro de request HTTP síncrono.
- Filas: `whatsapp-out`, `whatsapp-in`, `portals-sync`, `webhooks-in`, `notifications`, `reports`, `nfe`, `automations`.
- Jobs são idempotentes. Webhooks externos têm `external_id` único e são deduplicados.
- Workers rodam em processo separado (entry points em `src/workers/`).

### 4. Estrutura
- Lógica de domínio em `src/modules/<modulo>/` (services, repositories, schemas Zod).
- Server Actions em `src/app/(app)/[orgSlug]/<feature>/actions.ts`.
- Componentes UI em `src/components/` (shared) ou colocalizados na rota.
- Integrações externas em `src/lib/integrations/<integracao>/` com interface comum + adapters.
- Helpers de banco em `src/lib/db/` (cliente Prisma, tenant helpers).

### 5. Estilo de código
- Nomes em inglês (código, banco, comentários).
- Strings de UI em pt-BR.
- Funções pequenas e puras quando possível.
- Sem `any`. Quando precisar, comente o porquê.
- Erros tipados: criar `AppError` base e derivar `NotFoundError`, `PermissionError`, `ValidationError`, `IntegrationError`.
- Não use `console.log` em código de produção. Use `logger` de `src/lib/logger.ts`.

### 6. Banco de dados
- Migrations sempre via `prisma migrate dev --name descricao_clara`.
- Nunca editar migration já aplicada — criar nova.
- Índices compostos sempre começam com `organizationId`.
- Soft delete via `deletedAt` apenas em entidades que precisam (vehicle, lead, customer). O resto é hard delete.
- Enums em UPPER_SNAKE_CASE no banco e no Prisma.

### 7. UI
- shadcn/ui como base. Componentes em `src/components/ui/`.
- Toda lista grande usa paginação cursor-based.
- Toda mutation usa Server Action + `useFormState` ou `useTransition`.
- Loading states com Suspense quando possível.
- Mensagens de erro em pt-BR, claras, sem jargão técnico.
- Dark mode desde o início (Tailwind `dark:`).

### 8. Testes
- Vitest pra unit tests de services e helpers.
- Testar SEMPRE: lógica de permissões, helpers de tenant, validações Zod, cálculos de comissão, parsing de webhooks.
- Não testar componentes triviais nem rotas CRUD básicas no MVP.

### 9. O que NUNCA fazer
- Nunca usar `prisma` diretamente em código de feature (sempre `tenantDb`).
- Nunca chamar API externa sem fila.
- Nunca confiar em input do cliente sem Zod.
- Nunca fazer query N+1 (sempre `include` ou `select` explícito).
- Nunca expor `id` interno em URL pública sem checar permissão.
- Nunca commitar `.env`, certificados, chaves.
- Nunca usar `useEffect` pra buscar dados se Server Component resolve.

## Quando estiver em dúvida
- Sobre stack/arquitetura: consultar `docs/01-especificacao-tecnica.md`
- Sobre o banco: consultar `docs/02-modelo-de-dados.sql`
- Sobre o que entra em cada fase: consultar `docs/03-roadmap-faseado.md`
- Sobre permissões: consultar `src/lib/auth/permissions.ts`
```

---

## Estrutura inicial de pastas pra criar antes de começar

```
crm/
├── .cursorrules                  ← cole o conteúdo acima
├── docs/
│   ├── 01-especificacao-tecnica.md
│   ├── 02-modelo-de-dados.sql
│   ├── 03-roadmap-faseado.md
│   └── 04-guia-cursor.md
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   ├── lib/
│   │   ├── db/
│   │   ├── auth/
│   │   ├── queue/
│   │   ├── integrations/
│   │   ├── crypto.ts
│   │   └── logger.ts
│   ├── modules/
│   ├── components/
│   │   └── ui/
│   └── workers/
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.web
│   └── Dockerfile.worker
└── .env.example
```

---

## Sequência de prompts pra Fase 0 (fundação)

Use exatamente nessa ordem. Cada prompt assume que o anterior terminou.

### Prompt 1 — Setup inicial
```
Inicialize o projeto Next.js 15 com TypeScript, Tailwind v4, ESLint e Prettier.
Configure tsconfig com strict, noUncheckedIndexedAccess, noImplicitOverride.
Crie a estrutura de pastas: src/{app,lib,modules,components,workers},
docs/, docker/, prisma/.
Crie .env.example com as variáveis listadas em docs/01-especificacao-tecnica.md seção 9.
Crie .gitignore apropriado.
NÃO crie nenhum componente ainda. Só estrutura.
```

### Prompt 2 — Docker Compose local
```
Crie docker/docker-compose.yml com: postgres 16, redis 7, minio.
Senhas e portas via variáveis de ambiente do .env.
Crie volumes nomeados pra persistência.
Crie um script `pnpm db:up` no package.json que sobe esses serviços.
Não inclua a aplicação Next nesse compose ainda — só infra local.
```

### Prompt 3 — Prisma + schema base
```
Instale Prisma. Configure datasource pra DATABASE_URL.
Crie prisma/schema.prisma com APENAS estes models, baseados em
docs/02-modelo-de-dados.sql:
- Plan
- Organization
- Subscription
- User
- Account, Session (Auth.js)
- Membership (com enum OrgRole)
- Invitation

Adicione índices conforme o SQL. Use cuid() pra IDs.
Rode `prisma migrate dev --name initial`.
Crie um seed em prisma/seed.ts que cria 3 planos (starter, pro, enterprise).
```

### Prompt 4 — Tenant helper
```
Crie src/lib/db/index.ts exportando o singleton do PrismaClient.
Crie src/lib/db/tenant.ts com a função getTenantPrisma(organizationId: string)
que retorna um cliente Prisma "envelopado" que injeta automaticamente
{ where: { organizationId } } em toda query de modelos tenant-scoped.
Exporte também uma função withTenant(orgId, fn) que executa fn em uma
transação onde `SET app.current_org_id = orgId` foi setado, pra ativar RLS.
Crie src/lib/db/rls.sql com as policies de RLS pras tabelas que existem agora.
Documente como aplicar.
```

### Prompt 5 — Crypto helper
```
Crie src/lib/crypto.ts com:
- encrypt(plain: string): string  → AES-256-GCM, retorna base64(iv|tag|ciphertext)
- decrypt(encoded: string): string
Use ENCRYPTION_KEY do env (32 bytes hex).
Lance erro claro se a chave faltar.
Adicione testes Vitest.
```

### Prompt 6 — Auth.js v5
```
Instale next-auth@beta e @auth/prisma-adapter.
Configure src/lib/auth/index.ts com Auth.js v5:
- Adapter Prisma
- Providers: Credentials (e-mail/senha com bcrypt), Email (magic link via Resend)
- Session strategy: database
- Callbacks: jwt e session injetam memberships do usuário e activeOrgId
- Página de login customizada em /login
Crie src/middleware.ts protegendo rotas /(app) e redirecionando pra /login.
```

### Prompt 7 — Sistema de permissões
```
Crie src/lib/auth/permissions.ts com:
- type Resource = 'vehicle' | 'lead' | 'deal' | 'sale' | 'user' | 'billing' | 'settings'
- type Action = 'read' | 'create' | 'update' | 'delete' | 'manage'
- const PERMISSIONS: Record<OrgRole, Record<Resource, Action[]>> = { ... }
- function can(role: OrgRole, resource: Resource, action: Action): boolean
- function assertCan(role: OrgRole, resource: Resource, action: Action): void
   (lança PermissionError se não pode)
Preencha a matriz conforme docs/01-especificacao-tecnica.md seção 3.
Adicione testes.
```

### Prompt 8 — Signup e criação de organização
```
Crie a página /signup com formulário: nome, e-mail, senha, nome da loja.
Server Action que:
1. Valida com Zod
2. Cria User com bcrypt
3. Cria Organization com slug gerado a partir do nome (slugify + verificação de unicidade)
4. Cria Membership OWNER vinculando user à org
5. Cria Subscription TRIALING no plano starter, trial 14 dias
6. Faz signin automático
7. Redireciona pra /[orgSlug]/dashboard
Tudo em uma transação Prisma.
```

### Prompt 9 — Layout do app + sidebar
```
Crie o layout em src/app/(app)/[orgSlug]/layout.tsx:
- Valida que o usuário tem membership ativa nessa orgSlug, senão 403
- Sidebar com links pra: Dashboard, Estoque, Leads, Funil, Inbox, Agenda,
  Automações, Relatórios, Configurações
- Header com nome da org, switcher pra outras orgs do usuário, menu de perfil
- Use shadcn/ui (Sheet pra mobile, NavigationMenu)
- Dark mode toggle
```

### Prompt 10 — BullMQ + primeiro worker
```
Instale bullmq e ioredis.
Crie src/lib/queue/index.ts com:
- Conexão Redis singleton
- Helper createQueue(name) e createWorker(name, handler)
Crie src/lib/queue/queues.ts exportando todas as filas previstas.
Crie src/workers/example.worker.ts que processa fila 'example' e loga payload.
Crie scripts package.json: "worker:dev" rodando os workers com tsx watch.
Adicione um Server Action de teste em /dashboard que enfileira um job.
```

---

## Sequência de prompts pra Fase 1 (módulo de veículos como exemplo)

### Prompt V1 — Schema
```
Adicione ao schema.prisma os models Vehicle, VehiclePhoto, VehiclePriceHistory,
VehicleDocument conforme docs/02-modelo-de-dados.sql seção 3.
Inclua todos os enums (VehicleStatus, Transmission, FuelType).
Crie a migration. NÃO crie ainda services nem UI.
```

### Prompt V2 — Module de domínio
```
Crie src/modules/vehicles/ com:
- schemas.ts: Zod schemas pra create, update, filter
- repository.ts: funções que recebem tenantDb e fazem queries
- service.ts: lógica de negócio (createVehicle, updateVehicle, changePrice
  que registra histórico, etc.)
- types.ts: types derivados dos schemas
NÃO use o prisma diretamente, sempre tenantDb passado como parâmetro.
Adicione testes pros services principais.
```

### Prompt V3 — Server Actions
```
Crie src/app/(app)/[orgSlug]/vehicles/actions.ts com Server Actions:
- createVehicleAction(formData)
- updateVehicleAction(id, formData)
- deleteVehicleAction(id)
- changeVehiclePriceAction(id, newPrice, reason)
Cada action: pega session, resolve org, checa permissão, valida com Zod,
chama service, revalida o path, retorna { ok, error }.
```

### Prompt V4 — UI lista
```
Crie src/app/(app)/[orgSlug]/vehicles/page.tsx (Server Component):
- Lista veículos com filtros (status, marca, faixa de preço)
- Card por veículo com foto de capa, marca/modelo, ano, KM, preço
- Botão "Novo veículo" → /vehicles/new
- Paginação cursor-based
- Loading com Skeleton do shadcn
```

### Prompt V5 — UI form
```
Crie src/app/(app)/[orgSlug]/vehicles/new/page.tsx e /[id]/edit/page.tsx
reusando um VehicleForm em src/app/(app)/[orgSlug]/vehicles/_components/VehicleForm.tsx
- Form com react-hook-form + zodResolver
- Campos do schema, organizados em seções (Identificação, Características,
  Preço, Observações)
- Submit chama a Server Action
- Erros de validação inline
```

### Prompt V6 — Upload de fotos
```
Crie src/lib/storage/minio.ts com cliente MinIO e helper presignUpload(key).
Crie endpoint POST /api/uploads/presign que recebe { vehicleId, filename }
e retorna URL pré-assinada (validando permissão).
Crie componente PhotoUploader em vehicles/_components/ com dropzone (react-dropzone),
upload direto pro MinIO, e POST /api/vehicles/[id]/photos pra registrar.
Crie worker que, ao receber job 'process-vehicle-photo', baixa do MinIO,
gera thumb com Sharp, e atualiza thumb_url.
```

---

## Sequência de prompts pra módulo de WhatsApp (Fase 1 + 2)

> A ordem aqui importa: comece pela interface comum, depois o adapter da uazapi (que é o primeiro a entrar em produção), e só depois adicione Cloud API e Evolution.

### Prompt W1 — Interface e tipos comuns
```
Crie src/lib/integrations/whatsapp/provider.ts com:

- type MessageResult = { externalId: string; status: 'PENDING'|'SENT'|'FAILED' }
- type MediaInput = { type: 'image'|'video'|'audio'|'document'; url: string; caption?: string; mimeType?: string }
- type NormalizedEvent =
    | { type: 'message'; instanceExternalId: string; externalId: string;
        from: string; to: string; direction: 'INBOUND'|'OUTBOUND';
        messageType: 'text'|'image'|'video'|'audio'|'document'|'location';
        text?: string; mediaUrl?: string; timestamp: Date }
    | { type: 'status'; externalId: string; status: 'sent'|'delivered'|'read'|'failed' }
    | { type: 'connection'; instanceExternalId: string; status: 'connected'|'disconnected' }
- interface WhatsAppProvider com sendText, sendMedia, sendTemplate, receiveWebhook
- class IntegrationError extends AppError

Não implemente nenhum adapter ainda.
```

### Prompt W2 — Adapter uazapi (primeiro provider, default)
```
Crie src/lib/integrations/whatsapp/uazapi.ts implementando WhatsAppProvider.

Construtor recebe { baseUrl, instanceToken }.
Use fetch nativo, header 'token' com o instanceToken.
Implemente:
- sendText(to, text) → POST {baseUrl}/send/text  body { number, text }
- sendMedia(to, media) → POST {baseUrl}/send/media body { number, mediatype, media, caption }
- sendTemplate → throw IntegrationError('Templates HSM não suportados pela uazapi, use sendText')
- receiveWebhook(payload) → normaliza eventos pra NormalizedEvent[]
  - Eventos de mensagem viram { type: 'message', ... }
  - Eventos de status viram { type: 'status', ... }
  - Eventos de conexão viram { type: 'connection', ... }

IMPORTANTE: confirme os paths e nomes de campo exatos consultando
https://docs.uazapi.com antes de implementar. Se algum campo for ambíguo,
deixe um TODO comentado no código pra eu validar.

Crie testes Vitest mockando fetch pra cobrir cada método.
```

### Prompt W3 — Adapter Cloud API
```
Crie src/lib/integrations/whatsapp/cloud-api.ts implementando WhatsAppProvider.

Construtor recebe { phoneNumberId, accessToken, businessId }.
Use a Graph API v20.0 da Meta: https://graph.facebook.com/v20.0/{phoneNumberId}/messages
Header Authorization: Bearer {accessToken}.

Implemente os 4 métodos seguindo a documentação oficial:
https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages

receiveWebhook deve normalizar o payload do Meta pra NormalizedEvent[]:
o Meta envia { entry: [{ changes: [{ value: { messages, statuses } }] }] }.

Crie testes Vitest com fixtures dos payloads reais do Meta.
```

### Prompt W4 — Adapter Evolution
```
Crie src/lib/integrations/whatsapp/evolution.ts implementando WhatsAppProvider.

Construtor recebe { baseUrl, apiKey, instanceName }.
Header 'apikey' com o apiKey.

Endpoints da Evolution API v2:
- POST /message/sendText/{instance} body { number, text }
- POST /message/sendMedia/{instance} body { number, mediatype, media, caption }

receiveWebhook normaliza o formato Evolution (event 'messages.upsert' etc).

Testes Vitest com mock.
```

### Prompt W5 — Factory
```
Crie src/lib/integrations/whatsapp/factory.ts com:

export function getWhatsAppProvider(instance: WhatsAppInstance): WhatsAppProvider {
  switch (instance.provider) {
    case 'UAZAPI': return new UazapiProvider({
      baseUrl: instance.uazapiBaseUrl ?? process.env.UAZAPI_DEFAULT_BASE_URL!,
      instanceToken: decrypt(instance.uazapiToken!),
    });
    case 'CLOUD_API': return new CloudApiProvider({...});
    case 'EVOLUTION': return new EvolutionProvider({...});
  }
}

Toda chamada de envio no CRM passa por essa factory, NUNCA instancia
adapter direto. Isso garante que o resto do código não saiba nem se
importe com qual provider está sendo usado.
```

### Prompt W6 — Worker de envio
```
Crie src/workers/whatsapp-out.worker.ts processando a fila 'whatsapp-out'.

Job payload: { organizationId, instanceId, conversationId, messageId,
to, type: 'text'|'media', text?, media? }

Processo:
1. Carrega instance do banco (com tenant correto)
2. Resolve provider via factory
3. Chama método correspondente
4. Atualiza message no banco com externalId e status
5. Em caso de erro, atualiza status FAILED e re-lança pra BullMQ retentar
6. Configurar retry exponencial: 5 tentativas, backoff 5s/30s/2min/10min/1h

Crie também whatsapp-in.worker.ts processando webhooks recebidos:
1. Lê webhook_events não processados
2. Resolve instance pelo identificador no payload
3. Resolve provider via factory
4. Chama provider.receiveWebhook(payload)
5. Pra cada NormalizedEvent: cria/atualiza conversation, cria message,
   atualiza status, etc.
6. Marca webhook_events como processed
```

### Prompt W7 — Endpoints públicos de webhook
```
Crie:
- POST /api/webhooks/whatsapp/uazapi/[instanceId]
- POST /api/webhooks/whatsapp/cloud-api  (Meta usa URL fixa, identifica instance pelo phoneNumberId no payload)
- GET  /api/webhooks/whatsapp/cloud-api  (verificação do Meta com hub.challenge)
- POST /api/webhooks/whatsapp/evolution/[instanceId]

Cada endpoint:
1. Valida assinatura/token quando aplicável
2. Salva em webhook_events com external_id pra idempotência
3. Enfileira processamento na fila 'whatsapp-in'
4. Retorna 200 IMEDIATAMENTE (não processa síncrono)
```

---

## Dicas pra trabalhar bem com Cursor neste projeto

1. **Sempre referencie os docs.** No chat: `@docs/01-especificacao-tecnica.md` antes de pedir algo.
2. **Cole o schema relevante.** Antes de pedir uma feature, cole o trecho do model Prisma que ela toca. Reduz alucinação.
3. **Peça testes junto.** "Implemente X e crie testes Vitest cobrindo casos Y e Z."
4. **Revise diffs.** Não dê "Accept All" cego. Leia. Especialmente em código de tenant e permissões.
5. **Use o `.cursorrules` como contrato.** Se o Cursor violar uma regra, aponte: "Você está usando `prisma` direto, deveria usar `tenantDb`. Revise."
6. **Quando o Cursor enrolar, divida.** Se uma resposta vem com mais de 3 arquivos novos, refaça pedindo só o primeiro arquivo. Itere.
7. **Commit pequeno e frequente.** Cada feature termina com um commit. Se o Cursor te levar pra um caminho errado, `git reset` é seu amigo.
8. **Mantenha um arquivo `DECISIONS.md`** registrando escolhas arquiteturais não-óbvias. Daqui a 2 meses você não vai lembrar por que escolheu X.

---

## Sinal de alerta

Se em algum momento você se pegar pedindo "implementa o módulo X inteiro" e o Cursor cuspir 15 arquivos de uma vez, **PARE**. Reverta. Quebre em 5 prompts menores. Esse é o erro mais comum e o que mais gera retrabalho.
