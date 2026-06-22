
## Boa notícia: stack idêntico

O repositório `WeAreRocketz/shop-to-shops` **já usa o mesmo stack deste projeto Lovable**: TanStack Start + React 19 + Tailwind v4 + Supabase JS + Radix UI. Não precisa portar nada — é cópia direta de arquivos. Sem ativar Lovable Cloud.

## O que será copiado

- `src/` inteiro (routes, components, hooks, contexts, lib, integrations, router, start, styles) — preservando a estrutura
- `supabase/migrations/` (29 migrations) — para aplicar no seu projeto Supabase
- `supabase/config.toml`
- `components.json`, `eslint.config.js`, `bunfig.toml`, `tsconfig.json` se diferirem
- Dependências do `package.json` (instaladas via `bun add`)

Arquivos preservados: `package.json` raiz desta plataforma será atualizado, não substituído (mantém scripts/lockfile compatíveis).

## Estrutura do app (visão geral)

- **Público**: `/`, `/login`, `/signup`, `/report-abuse`, páginas legais (`/legal/*`)
- **Autenticado** (`_authenticated/`): dashboard completo (products, stores, cart, finance, mappings, analytics, settings, support, tracking, distribution, camuflador, bulk-edit, onboarding) e área admin (users, workspaces, plans, tickets, abuse-reports, metrics)
- **APIs públicas** (`/api/public/*`): `s2s-cart.js`, `s2s-checkout`, `s2s-settings`, `s2s-track`, `shopify-order-webhook`

Sem Supabase Edge Functions — toda lógica server roda em `createServerFn` / server routes do TanStack (compatível direto).

## Conectar ao seu Supabase

O cliente já lê de variáveis de ambiente. Vou cadastrar como secrets (sem hardcode):

- `VITE_SUPABASE_URL` + `SUPABASE_URL` (mesma URL, duas chaves para client e server)
- `VITE_SUPABASE_PUBLISHABLE_KEY` + `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (para operações admin)

Secrets adicionais detectadas no código (opcionais, conforme você for usar):
- `STRIPE_SECRET_KEY` — se for usar checkout Stripe
- `LOVABLE_API_KEY` — se houver uso de Lovable AI (posso remover se preferir)
- `DATABASE_URL` — só se algum server fn fizer SQL direto

## Migrations no seu Supabase novo

29 arquivos SQL precisam rodar **na ordem cronológica** no seu projeto. Duas opções:

1. **Você roda via Supabase CLI** (`supabase db push` apontando seu projeto) — recomendado, mais limpo
2. **Você cola em ordem no SQL Editor** do dashboard Supabase — funciona, mais manual

Não posso executar SQL no seu Supabase a partir daqui (não temos credenciais de DB), só posso entregar os arquivos no projeto.

## Passos de execução

1. Copiar `src/` (substituindo o scaffold atual) e `supabase/` (migrations + config)
2. Copiar `components.json`, `bunfig.toml` se diferirem
3. Mesclar dependências no `package.json` e rodar `bun install`
4. Pedir suas credenciais via formulário seguro (`add_secret`) — você cola URL + publishable + service role
5. Verificar build e preview; ajustar qualquer import quebrado se aparecer
6. Te entregar instruções de como rodar as migrations no seu Supabase

## Riscos e ressalvas

- **Database vazio até você rodar as migrations** → telas autenticadas vão dar erro de "tabela não existe" antes desse passo
- **Storage buckets, Auth providers (Google/etc) e Edge Function secrets** que existam no Supabase original precisam ser recriados manualmente no seu projeto (não vêm nas migrations)
- **Webhook do Shopify** (`/api/public/shopify-order-webhook`) precisará da URL atualizada no painel da Shopify quando publicar
- **Realtime/publications**: se o app original usava, você precisa habilitar nas tabelas correspondentes no seu Supabase
- Possíveis ajustes pós-cópia se algum arquivo gerado (`routeTree.gen.ts`, `types.ts`) precisar regenerar

## Confirmação necessária

Antes de eu começar, confirme:

- Pode sobrescrever o conteúdo atual deste projeto Lovable? (vai apagar o scaffold em branco)
- Quer que eu mantenha `LOVABLE_API_KEY` (caso o app use IA) ou removo todas as features de IA?
- Você prefere rodar as migrations via Supabase CLI ou via SQL Editor do dashboard?
