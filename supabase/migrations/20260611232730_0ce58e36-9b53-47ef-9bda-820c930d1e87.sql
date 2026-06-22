
CREATE TABLE public.cart_drawer_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cart_drawer_configs_workspace ON public.cart_drawer_configs(workspace_id);
CREATE INDEX idx_cart_drawer_configs_store ON public.cart_drawer_configs(store_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_drawer_configs TO authenticated;
GRANT ALL ON public.cart_drawer_configs TO service_role;
GRANT SELECT ON public.cart_drawer_configs TO anon;

ALTER TABLE public.cart_drawer_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members manage cart drawer configs"
  ON public.cart_drawer_configs
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (SELECT w.id FROM public.workspaces w WHERE w.user_id = auth.uid())
  )
  WITH CHECK (
    workspace_id IN (SELECT w.id FROM public.workspaces w WHERE w.user_id = auth.uid())
  );

CREATE POLICY "Anon can read published cart drawer configs"
  ON public.cart_drawer_configs
  FOR SELECT
  TO anon
  USING (published_at IS NOT NULL);

CREATE TRIGGER set_cart_drawer_configs_updated_at
  BEFORE UPDATE ON public.cart_drawer_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
