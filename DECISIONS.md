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


### YYYY-MM-DD — Identidade visual do VrumCar
**Contexto**: Marca e cor primária definidas antes da fase de UI.
**Decisão**: 
- Nome: VrumCar (minúsculas no logo, capital só no V estilizado como checkmark)
- Subtítulo: "CRM" em peso menor, cinza/branco conforme contraste
- Cor primária: roxo vibrante (hex exato a confirmar, provavelmente próximo a #6D28D9)
- Logo tem 2 variantes principais: gradiente colorido sobre fundo escuro, e monocromática branca sobre fundo roxo
- Símbolo: o "V" estilizado como checkmark também funciona isolado como mark (pra favicon, colapso de sidebar)
**Consequência**: 
- Tema do Tailwind/shadcn vai usar roxo como primary
- Login, signup, dashboard e todos os componentes compartilharão essa identidade
- Necessário exportar SVGs nas variantes antes de chegar no Prompt 9 (layout)

### 2026-04-09 — lazyConnect: true no Redis do BullMQ
**Contexto**: next build executa imports pra análise estática. Se a
conexão com Redis abrir no momento do import, o build falha quando o
Redis não está acessível (CI/CD, ambientes de deploy).
**Decisão**: Usar lazyConnect: true na conexão ioredis. Conexão real
só abre na primeira operação.
**Consequência**: Build confiável mesmo sem Redis disponível. Primeiro
job enfileirado paga o custo da conexão inicial (desprezível).

### 2026-04-09 — @ts-expect-error em addJob (BullMQ 5 generics)
**Contexto**: BullMQ 5 usa tipos mapeados internos (ExtractDataType,
ExtractNameType) que não fecham bem com genéricos externos em wrappers
type-safe como nosso addJob.
**Decisão**: Usar @ts-expect-error com comentário explicativo no único
ponto de fricção. O type-safety externo (QueueJobMap) continua valendo
pros usuários da API.
**Consequência**: API de filas permanece type-safe do ponto de vista
de quem usa. Débito técnico contido a 1 linha. @ts-expect-error (não
@ts-ignore) falha se BullMQ corrigir os tipos no futuro, nos avisando
que dá pra remover.

### 2026-04-09 — Infra de filas type-safe desde o dia 1
**Contexto**: Nenhuma fila de produção existe ainda, só uma de
exemplo. Mas arquitetura com QueueJobMap tipado foi escolhida desde
o começo.
**Decisão**: Criar infra "over-engineered" pra 1 fila porque sabemos
que vão ser 7-10 filas até o fim da Fase 2 (whatsapp-out, whatsapp-in,
automations, ai-execution, portals-sync, notifications, etc). O custo
de retrabalho se não tipasse seria muito maior.
**Consequência**: Qualquer fila nova que entre vai ter payload tipado
em tempo de compilação. Previne uma classe inteira de bugs "worker
quebra porque alguém enfileirou payload errado".

### 2026-04-09 — Bucket policy aplicada no ensureBucket (em vez de config manual)

**Contexto**: Upload de fotos via MinIO funcionava (arquivo subia com
sucesso), mas o <img> no navegador mostrava ícone quebrado. Causa:
MinIO recente tem bucket privado por default e o ACL: 'public-read'
no PutObjectCommand é ignorado silenciosamente. Precisa de uma bucket
policy explícita pra permitir leitura anônima.

**Decisão**: Aplicar a policy pública via PutBucketPolicyCommand dentro
da função ensureBucket(), em vez de configurar manualmente no console
do MinIO. Também removido o ACL por objeto do PutObjectCommand
(redundante e pode conflitar).

**Consequência**:
- Funciona igual em dev local (MinIO) e produção (AWS S3, GCS, etc)
- Zero configuração manual de bucket em qualquer ambiente
- Policy fica versionada no código, auditável
- Idempotente: pode rodar 1000 vezes sem problema
- Protege contra drift de configuração (buckets criados fora do código
  também ganham a policy)
- Uploads (PUT) continuam precisando de credenciais — só GET é público

**Lição aprendida**: Sempre que um serviço de infraestrutura precisar
de configuração, preferir código declarativo e idempotente versionado
no repositório a checklists manuais no console — reduz drift entre
ambientes e facilita onboarding.