
REVOKE EXECUTE ON FUNCTION public.evaluate_store_limits(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_store_limits(UUID) TO service_role;
