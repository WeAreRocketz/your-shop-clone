
CREATE TYPE public.operation_mode AS ENUM ('direct','warmup','smart_advance');
CREATE TYPE public.operation_status AS ENUM ('draft','active','paused','archived');

CREATE TABLE public.operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mode public.operation_mode NOT NULL DEFAULT 'direct',
  status public.operation_status NOT NULL DEFAULT 'draft',
  vitrine_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  cart_template_id UUID,
  current_step INT NOT NULL DEFAULT 1,
  warmup_simultaneous BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operations TO authenticated;
GRANT ALL ON public.operations TO service_role;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage operations" ON public.operations
  FOR ALL TO authenticated
  USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE TRIGGER trg_operations_updated_at
  BEFORE UPDATE ON public.operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.operation_checkout_stores (
  operation_id UUID NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  limit_metric TEXT,
  limit_window TEXT,
  limit_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (operation_id, store_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operation_checkout_stores TO authenticated;
GRANT ALL ON public.operation_checkout_stores TO service_role;
ALTER TABLE public.operation_checkout_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage operation checkout stores" ON public.operation_checkout_stores
  FOR ALL TO authenticated
  USING (operation_id IN (
    SELECT o.id FROM public.operations o
    JOIN public.workspaces w ON w.id = o.workspace_id
    WHERE w.user_id = auth.uid()
  ))
  WITH CHECK (operation_id IN (
    SELECT o.id FROM public.operations o
    JOIN public.workspaces w ON w.id = o.workspace_id
    WHERE w.user_id = auth.uid()
  ));

CREATE INDEX idx_operations_workspace ON public.operations(workspace_id);
CREATE INDEX idx_op_checkout_stores_op ON public.operation_checkout_stores(operation_id);
