
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TYPE public.cart_session_status AS ENUM ('active','checkout_started','completed','abandoned');

CREATE TABLE public.cart_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  vitrine_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  session_token text NOT NULL UNIQUE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  assigned_checkout_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  status public.cart_session_status NOT NULL DEFAULT 'active',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cart_sessions_workspace_idx ON public.cart_sessions(workspace_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_sessions TO authenticated;
GRANT ALL ON public.cart_sessions TO service_role;
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own cart sessions"
ON public.cart_sessions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = cart_sessions.workspace_id AND w.user_id = auth.uid()));

CREATE TABLE public.checkout_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  cart_session_id uuid REFERENCES public.cart_sessions(id) ON DELETE SET NULL,
  source_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  target_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  distribution_rule text NOT NULL,
  shopify_draft_order_id text,
  checkout_url text,
  status text NOT NULL DEFAULT 'created',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX checkout_distributions_workspace_idx ON public.checkout_distributions(workspace_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkout_distributions TO authenticated;
GRANT ALL ON public.checkout_distributions TO service_role;
ALTER TABLE public.checkout_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own distributions"
ON public.checkout_distributions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = checkout_distributions.workspace_id AND w.user_id = auth.uid()));
