CREATE TABLE public.store_camouflage_settings (
  store_id        UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  enabled         BOOLEAN NOT NULL DEFAULT false,
  zoom            NUMERIC NOT NULL DEFAULT 1.00,
  blur            NUMERIC NOT NULL DEFAULT 0,
  brightness      NUMERIC NOT NULL DEFAULT 1.00,
  saturation      NUMERIC NOT NULL DEFAULT 1.00,
  hue_shift       INTEGER NOT NULL DEFAULT 0,
  flip_horizontal BOOLEAN NOT NULL DEFAULT false,
  watermark_text  TEXT,
  apply_to_titles BOOLEAN NOT NULL DEFAULT false,
  title_suffix    TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_camouflage_settings TO authenticated;
GRANT ALL ON public.store_camouflage_settings TO service_role;

ALTER TABLE public.store_camouflage_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage camouflage of own workspace stores"
  ON public.store_camouflage_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.workspaces w ON w.id = s.workspace_id
      WHERE s.id = store_camouflage_settings.store_id AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stores s
      JOIN public.workspaces w ON w.id = s.workspace_id
      WHERE s.id = store_camouflage_settings.store_id AND w.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_camouflage_updated_at
  BEFORE UPDATE ON public.store_camouflage_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();