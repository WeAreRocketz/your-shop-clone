
-- ===== 1. cart_sessions: colunas de atribuição =====
ALTER TABLE public.cart_sessions
  ADD COLUMN IF NOT EXISTS fbclid TEXT,
  ADD COLUMN IF NOT EXISTS gclid TEXT,
  ADD COLUMN IF NOT EXISTS ttclid TEXT,
  ADD COLUMN IF NOT EXISTS fbp TEXT,
  ADD COLUMN IF NOT EXISTS fbc TEXT,
  ADD COLUMN IF NOT EXISTS ttp TEXT,
  ADD COLUMN IF NOT EXISTS client_user_agent TEXT,
  ADD COLUMN IF NOT EXISTS event_source_url TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- ===== 2. stores: webhook secret =====
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- ===== 3. enum de plataforma =====
DO $$ BEGIN
  CREATE TYPE public.pixel_platform AS ENUM ('meta', 'tiktok', 'google_ads', 'ga4');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== 4. store_pixels =====
CREATE TABLE IF NOT EXISTS public.store_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  platform public.pixel_platform NOT NULL,
  pixel_id TEXT NOT NULL,
  access_token TEXT,
  test_event_code TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_event_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, platform)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_pixels TO authenticated;
GRANT ALL ON public.store_pixels TO service_role;
ALTER TABLE public.store_pixels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage store pixels"
  ON public.store_pixels FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stores s
    JOIN public.workspaces w ON w.id = s.workspace_id
    WHERE s.id = store_pixels.store_id AND w.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.stores s
    JOIN public.workspaces w ON w.id = s.workspace_id
    WHERE s.id = store_pixels.store_id AND w.user_id = auth.uid()
  ));

CREATE TRIGGER store_pixels_updated_at
  BEFORE UPDATE ON public.store_pixels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== 5. tracking_events (log) =====
CREATE TABLE IF NOT EXISTS public.tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  cart_session_id UUID REFERENCES public.cart_sessions(id) ON DELETE SET NULL,
  platform public.pixel_platform NOT NULL,
  event_name TEXT NOT NULL,
  event_id TEXT,
  status TEXT NOT NULL,            -- success | error
  http_status INTEGER,
  latency_ms INTEGER,
  request_payload JSONB,
  response_body JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tracking_events_workspace_idx
  ON public.tracking_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tracking_events_store_idx
  ON public.tracking_events(store_id, created_at DESC);

GRANT SELECT ON public.tracking_events TO authenticated;
GRANT ALL ON public.tracking_events TO service_role;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners read tracking events"
  ON public.tracking_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = tracking_events.workspace_id AND w.user_id = auth.uid()
  ));
