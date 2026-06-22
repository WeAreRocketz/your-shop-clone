
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_orders_monthly INTEGER;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS trial_days INTEGER;

GRANT SELECT ON public.plans TO authenticated, anon;
GRANT ALL ON public.plans TO service_role;

UPDATE public.plans SET slug='free_trial', price_monthly=0, max_stores=2, max_products=50, max_orders_monthly=30, is_trial=true, trial_days=14 WHERE name='Free Trial';
UPDATE public.plans SET slug='starter', price_monthly=29, max_stores=3, max_products=200, max_orders_monthly=200, is_trial=false, trial_days=NULL WHERE name='Starter';
UPDATE public.plans SET slug='growth', price_monthly=79, max_stores=10, max_products=2000, max_orders_monthly=2000, is_trial=false, trial_days=NULL WHERE name='Growth';
UPDATE public.plans SET slug='pro', price_monthly=199, max_stores=NULL, max_products=NULL, max_orders_monthly=NULL, is_trial=false, trial_days=NULL WHERE name='Pro';

INSERT INTO public.plans (slug, name, price_monthly, max_stores, max_products, max_orders_monthly, is_trial, trial_days)
SELECT v.slug, v.name, v.price_monthly, v.max_stores, v.max_products, v.max_orders_monthly, v.is_trial, v.trial_days
FROM (VALUES
  ('free_trial','Free Trial',0::numeric,2,50,30,true,14),
  ('starter','Starter',29::numeric,3,200,200,false,NULL::int),
  ('growth','Growth',79::numeric,10,2000,2000,false,NULL::int),
  ('pro','Pro',199::numeric,NULL::int,NULL::int,NULL::int,false,NULL::int)
) AS v(slug,name,price_monthly,max_stores,max_products,max_orders_monthly,is_trial,trial_days)
WHERE NOT EXISTS (SELECT 1 FROM public.plans p WHERE p.slug = v.slug OR p.name = v.name);

ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id);
ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

UPDATE public.workspaces
SET plan_id = (SELECT id FROM public.plans WHERE slug = 'free_trial'),
    trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '14 days')
WHERE plan_id IS NULL;

CREATE OR REPLACE FUNCTION public.set_workspace_default_plan()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.plan_id IS NULL THEN
    NEW.plan_id := (SELECT id FROM public.plans WHERE slug = 'free_trial');
  END IF;
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := now() + INTERVAL '14 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workspaces_set_default_plan ON public.workspaces;
CREATE TRIGGER workspaces_set_default_plan
  BEFORE INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_default_plan();

CREATE OR REPLACE FUNCTION public.check_plan_limit(_workspace_id UUID, _resource TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _plan public.plans;
  _used INTEGER;
  _max INTEGER;
BEGIN
  SELECT p.* INTO _plan FROM public.workspaces w JOIN public.plans p ON p.id = w.plan_id WHERE w.id = _workspace_id;
  IF _plan IS NULL THEN RETURN true; END IF;

  IF _resource = 'stores' THEN
    _max := _plan.max_stores;
    SELECT COUNT(*) INTO _used FROM public.stores WHERE workspace_id = _workspace_id;
  ELSIF _resource = 'products' THEN
    _max := _plan.max_products;
    SELECT COUNT(*) INTO _used FROM public.products WHERE workspace_id = _workspace_id;
  ELSIF _resource = 'orders' THEN
    _max := _plan.max_orders_monthly;
    SELECT COUNT(*) INTO _used FROM public.checkout_distributions
      WHERE workspace_id = _workspace_id AND created_at >= date_trunc('month', now());
  ELSE
    RETURN true;
  END IF;

  IF _max IS NULL THEN RETURN true; END IF;
  RETURN _used < _max;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_stores_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT public.check_plan_limit(NEW.workspace_id, 'stores') THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: stores. Faça upgrade do seu plano para conectar mais lojas.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_products_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT public.check_plan_limit(NEW.workspace_id, 'products') THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: products. Faça upgrade do seu plano para sincronizar mais produtos.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_orders_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT public.check_plan_limit(NEW.workspace_id, 'orders') THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: orders. Faça upgrade do seu plano para processar mais pedidos este mês.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_enforce_limit ON public.stores;
CREATE TRIGGER stores_enforce_limit BEFORE INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_stores_limit();

DROP TRIGGER IF EXISTS products_enforce_limit ON public.products;
CREATE TRIGGER products_enforce_limit BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_products_limit();

DROP TRIGGER IF EXISTS checkout_distributions_enforce_limit ON public.checkout_distributions;
CREATE TRIGGER checkout_distributions_enforce_limit BEFORE INSERT ON public.checkout_distributions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_orders_limit();
