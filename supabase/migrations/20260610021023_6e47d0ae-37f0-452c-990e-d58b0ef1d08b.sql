
-- Drop the unused oauth_sessions table (custom apps, no OAuth flow)
DROP TABLE IF EXISTS public.oauth_sessions;

-- sync_jobs status enum
CREATE TYPE public.sync_job_status AS ENUM ('pending','running','done','error');

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  shopify_product_id text NOT NULL,
  title text NOT NULL,
  description text,
  handle text,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  vendor text,
  product_type text,
  status text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, shopify_product_id)
);

CREATE INDEX products_store_id_idx ON public.products(store_id);
CREATE INDEX products_handle_idx ON public.products(handle);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage products of own workspaces"
ON public.products FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.stores s
  JOIN public.workspaces w ON w.id = s.workspace_id
  WHERE s.id = products.store_id AND w.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.stores s
  JOIN public.workspaces w ON w.id = s.workspace_id
  WHERE s.id = products.store_id AND w.user_id = auth.uid()
));

CREATE TABLE public.sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status public.sync_job_status NOT NULL DEFAULT 'pending',
  products_synced integer NOT NULL DEFAULT 0,
  products_total integer,
  errors_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sync_jobs_store_id_idx ON public.sync_jobs(store_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_jobs TO authenticated;
GRANT ALL ON public.sync_jobs TO service_role;

ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage sync_jobs of own workspaces"
ON public.sync_jobs FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.workspaces w
  WHERE w.id = sync_jobs.workspace_id AND w.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workspaces w
  WHERE w.id = sync_jobs.workspace_id AND w.user_id = auth.uid()
));
