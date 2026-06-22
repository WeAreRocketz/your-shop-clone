
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
    SELECT COUNT(*) INTO _used FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE s.workspace_id = _workspace_id;
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

CREATE OR REPLACE FUNCTION public.enforce_products_limit()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _ws UUID;
BEGIN
  SELECT workspace_id INTO _ws FROM public.stores WHERE id = NEW.store_id;
  IF _ws IS NOT NULL AND NOT public.check_plan_limit(_ws, 'products') THEN
    RAISE EXCEPTION 'PLAN_LIMIT_REACHED: products. Faça upgrade do seu plano para sincronizar mais produtos.';
  END IF;
  RETURN NEW;
END;
$$;
