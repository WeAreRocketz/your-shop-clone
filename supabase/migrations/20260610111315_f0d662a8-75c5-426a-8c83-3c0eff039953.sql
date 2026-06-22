
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS cart_disabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cart_disabled_reason TEXT,
  ADD COLUMN IF NOT EXISTS cart_disabled_at TIMESTAMPTZ;

CREATE TABLE public.store_rotation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  metric TEXT NOT NULL CHECK (metric IN ('orders','revenue','items')),
  time_window TEXT NOT NULL CHECK (time_window IN ('day','week','month')),
  limit_value NUMERIC NOT NULL CHECK (limit_value > 0),
  action TEXT NOT NULL CHECK (action IN ('rotate','disable_cart','rotate_then_disable','notify_only')),
  fallback_store_ids UUID[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_rotation_rules TO authenticated;
GRANT ALL ON public.store_rotation_rules TO service_role;
ALTER TABLE public.store_rotation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage rotation rules"
ON public.store_rotation_rules FOR ALL TO authenticated
USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()))
WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE TRIGGER trg_rotation_rules_updated
BEFORE UPDATE ON public.store_rotation_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.store_rotation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.store_rotation_rules(id) ON DELETE SET NULL,
  action_taken TEXT NOT NULL,
  redirected_to_store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  metric TEXT,
  time_window TEXT,
  consumed NUMERIC,
  limit_value NUMERIC,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.store_rotation_events TO authenticated;
GRANT ALL ON public.store_rotation_events TO service_role;
ALTER TABLE public.store_rotation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read rotation events"
ON public.store_rotation_events FOR SELECT TO authenticated
USING (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE POLICY "members insert rotation events"
ON public.store_rotation_events FOR INSERT TO authenticated
WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.evaluate_store_limits(_store_id UUID)
RETURNS TABLE (
  rule_id UUID,
  metric TEXT,
  time_window TEXT,
  limit_value NUMERIC,
  consumed NUMERIC,
  exceeded BOOLEAN,
  action TEXT,
  fallback_store_ids UUID[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  _since TIMESTAMPTZ;
  _consumed NUMERIC;
BEGIN
  FOR r IN SELECT * FROM public.store_rotation_rules WHERE store_id = _store_id AND enabled = true LOOP
    _since := CASE r.time_window
      WHEN 'day' THEN date_trunc('day', now())
      WHEN 'week' THEN date_trunc('week', now())
      WHEN 'month' THEN date_trunc('month', now())
    END;

    IF r.metric = 'orders' THEN
      SELECT COUNT(*)::NUMERIC INTO _consumed
      FROM public.checkout_distributions
      WHERE target_store_id = _store_id AND created_at >= _since;
    ELSIF r.metric = 'revenue' THEN
      SELECT COALESCE(SUM(
        (SELECT COALESCE(SUM((i->>'price')::NUMERIC * COALESCE((i->>'quantity')::NUMERIC,1)),0)
         FROM jsonb_array_elements(COALESCE(cs.items,'[]'::jsonb)) i)
      ),0) INTO _consumed
      FROM public.checkout_distributions cd
      LEFT JOIN public.cart_sessions cs ON cs.id = cd.cart_session_id
      WHERE cd.target_store_id = _store_id AND cd.created_at >= _since;
    ELSIF r.metric = 'items' THEN
      SELECT COALESCE(SUM(
        (SELECT COALESCE(SUM(COALESCE((i->>'quantity')::NUMERIC,1)),0)
         FROM jsonb_array_elements(COALESCE(cs.items,'[]'::jsonb)) i)
      ),0) INTO _consumed
      FROM public.checkout_distributions cd
      LEFT JOIN public.cart_sessions cs ON cs.id = cd.cart_session_id
      WHERE cd.target_store_id = _store_id AND cd.created_at >= _since;
    END IF;

    rule_id := r.id;
    metric := r.metric;
    time_window := r.time_window;
    limit_value := r.limit_value;
    consumed := COALESCE(_consumed,0);
    exceeded := consumed >= r.limit_value;
    action := r.action;
    fallback_store_ids := r.fallback_store_ids;
    RETURN NEXT;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.evaluate_store_limits(UUID) TO authenticated, service_role;
