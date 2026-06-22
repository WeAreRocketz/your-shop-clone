
CREATE OR REPLACE FUNCTION public.check_plan_limit(_workspace_id UUID, _resource TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public AS $$
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
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.check_plan_limit(NEW.workspace_id, 'stores') THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: stores. Faça upgrade do seu plano para conectar mais lojas.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_products_limit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.check_plan_limit(NEW.workspace_id, 'products') THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: products. Faça upgrade do seu plano para sincronizar mais produtos.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_orders_limit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.check_plan_limit(NEW.workspace_id, 'orders') THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: orders. Faça upgrade do seu plano para processar mais pedidos este mês.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_workspace_default_plan() FROM PUBLIC, anon, authenticated;
