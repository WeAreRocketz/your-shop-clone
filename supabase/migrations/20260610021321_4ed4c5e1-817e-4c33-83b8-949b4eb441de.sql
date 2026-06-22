
CREATE TYPE public.mapping_method AS ENUM ('manual','tag','ai','auto');

CREATE TABLE public.product_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  source_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  target_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  target_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  target_variant_id text,
  source_variant_id text,
  mapping_method public.mapping_method NOT NULL DEFAULT 'manual',
  confidence_score integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_product_id, target_store_id)
);

CREATE INDEX product_mappings_source_idx ON public.product_mappings(source_store_id);
CREATE INDEX product_mappings_target_idx ON public.product_mappings(target_store_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_mappings TO authenticated;
GRANT ALL ON public.product_mappings TO service_role;

ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own mappings"
ON public.product_mappings FOR ALL
USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = product_mappings.workspace_id AND w.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = product_mappings.workspace_id AND w.user_id = auth.uid()));

CREATE TABLE public.tag_mapping_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  target_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_store_id, target_store_id, tag)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tag_mapping_rules TO authenticated;
GRANT ALL ON public.tag_mapping_rules TO service_role;

ALTER TABLE public.tag_mapping_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own tag rules"
ON public.tag_mapping_rules FOR ALL
USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = tag_mapping_rules.workspace_id AND w.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = tag_mapping_rules.workspace_id AND w.user_id = auth.uid()));

CREATE TABLE public.auto_sync_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  target_store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_store_id, target_store_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.auto_sync_settings TO authenticated;
GRANT ALL ON public.auto_sync_settings TO service_role;

ALTER TABLE public.auto_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own auto sync"
ON public.auto_sync_settings FOR ALL
USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = auto_sync_settings.workspace_id AND w.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = auto_sync_settings.workspace_id AND w.user_id = auth.uid()));
