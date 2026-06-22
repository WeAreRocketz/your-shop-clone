
-- 1) Status fields on stores
DO $$ BEGIN
  CREATE TYPE public.store_status AS ENUM ('active', 'down', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS status public.store_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT,
  ADD COLUMN IF NOT EXISTS notified_down_at TIMESTAMPTZ;

-- 2) Receivables table
CREATE TABLE IF NOT EXISTS public.store_receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  retained_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  release_days INTEGER,
  expected_release_date DATE,
  receiving_account TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | received
  notes TEXT,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_receivables TO authenticated;
GRANT ALL ON public.store_receivables TO service_role;

ALTER TABLE public.store_receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage receivables of own workspaces"
  ON public.store_receivables FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = store_receivables.workspace_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = store_receivables.workspace_id AND w.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_store_receivables_updated_at ON public.store_receivables;
CREATE TRIGGER update_store_receivables_updated_at
  BEFORE UPDATE ON public.store_receivables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_store_receivables_store ON public.store_receivables(store_id);
CREATE INDEX IF NOT EXISTS idx_store_receivables_workspace ON public.store_receivables(workspace_id);
