## Objetivo

Expandir o painel admin existente (`/admin`) para que **digitalrocketoficial@gmail.com** tenha controle total: planos, papéis, financeiro, edição de plano de cada usuário, e **aprovar/rejeitar cadastros** antes do acesso à plataforma.

---

## 1. Banco de dados (migration)

**Aprovação de cadastro**
- Adicionar `profiles.approval_status` (`pending` | `approved` | `rejected`, default `pending`)
- `profiles.approved_at`, `profiles.approved_by`, `profiles.rejection_reason`
- Backfill: todos os profiles existentes + o admin = `approved`
- Trigger `handle_new_user` cria profile com status `pending`

**Edição de plano por usuário**
- Adicionar `workspaces.plan_override_id` (admin força um plano específico ignorando billing)
- Adicionar `workspaces.plan_notes` (texto livre admin)
- Helper SQL `admin_set_workspace_plan(workspace_id, plan_id, notes)`

**Financeiro admin**
- View `admin_financial_overview`: MRR, total receita por plano, contagem por status, trial expirando, inadimplência
- View `admin_workspace_billing`: por workspace — plano atual, próximo vencimento, último pagamento, status

**Garantir admin Digital Rocket**
- Inserir role `admin` para o user_id de `digitalrocketoficial@gmail.com` (idempotente via `ON CONFLICT`)

**RLS / Grants**
- Todas as novas colunas/views: `GRANT SELECT TO authenticated`
- Policies novas: somente `has_role(auth.uid(), 'admin')` pode UPDATE em approval_status / plan_override_id

---

## 2. Gate de aprovação no login

- Criar rota pública `/pending-approval` mostrando "Seu cadastro está aguardando aprovação"
- No `_authenticated/route.tsx`: após validar sessão, checar `profiles.approval_status`. Se `pending` → redirect `/pending-approval`. Se `rejected` → redirect `/pending-approval?status=rejected` com mensagem
- Admin sempre passa (bypass do gate)

---

## 3. Novas páginas admin

**`/admin/approvals`** — fila de cadastros pendentes
- Tabela: email, nome, data cadastro, workspace
- Ações: **Aprovar** / **Rejeitar** (com motivo opcional)
- Filtro por status (pending/approved/rejected)

**`/admin/financial`** — visão financeira global
- Cards: MRR, receita total, # assinantes ativos, # em trial, # inadimplentes
- Tabela por plano: assinantes, receita
- Tabela: trials expirando nos próximos 7 dias

**`/admin/workspaces/$id`** — detalhe + edição de workspace
- Ler workspace, owner, plano atual, uso
- Form: trocar plano (dropdown de planos), notas admin, estender trial, salvar
- Atalho a partir da lista existente `/admin/workspaces`

**Atualizar `/admin/users`**
- Adicionar coluna "Status" (approval_status) + botões inline aprovar/rejeitar
- Já existe toggle de role admin — manter

---

## 4. Server functions (`src/lib/api/admin.functions.ts`)

Todas com `requireSupabaseAuth` + check `has_role(userId, 'admin')`:
- `approveUser({ userId })` / `rejectUser({ userId, reason })`
- `setWorkspacePlan({ workspaceId, planId, notes })`
- `extendTrial({ workspaceId, days })`
- `getFinancialOverview()` → lê as views
- `getPendingApprovals()` / `getAllUsersWithStatus()`

---

## 5. Sidebar admin
Adicionar links: **Aprovações** (com badge de pendentes), **Financeiro**. Reorganizar ordem.

---

## Detalhes técnicos

```text
src/routes/_authenticated/
  admin.approvals.tsx       (novo)
  admin.financial.tsx       (novo)
  admin.workspaces.$id.tsx  (novo — detalhe)
  admin.users.tsx           (atualizar)
  route.tsx                 (gate de approval)
src/routes/pending-approval.tsx  (novo — público)
src/lib/api/admin.functions.ts   (novo)
src/components/admin-sidebar.tsx (atualizar)
supabase/migrations/<ts>_admin_full_control.sql
```

A migration cria toda a infra de uma vez (colunas, views, helper, role admin do Digital Rocket, RLS, grants). Após aplicada, todas as páginas novas funcionam imediatamente.

---

## Fora do escopo (confirmar se quer incluir)
- Integração de cobrança real (Stripe/Paddle) — o painel financeiro lê dados do que já existe; não cria checkout
- Notificação por email ao aprovar/rejeitar — posso adicionar via Resend se quiser
- Histórico/audit log de ações admin — posso adicionar tabela `admin_audit_log` se quiser

Confirma que sigo com este plano? Se quiser email de notificação no aprovar/rejeitar e audit log, me diga antes de eu começar.