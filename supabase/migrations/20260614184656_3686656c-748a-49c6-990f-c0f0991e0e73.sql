UPDATE public.plans SET trial_days = 5 WHERE slug = 'free_trial';

CREATE OR REPLACE FUNCTION public.set_workspace_default_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.plan_id IS NULL THEN
    NEW.plan_id := (SELECT id FROM public.plans WHERE slug = 'free_trial');
  END IF;
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := now() + INTERVAL '5 days';
  END IF;
  RETURN NEW;
END;
$function$;