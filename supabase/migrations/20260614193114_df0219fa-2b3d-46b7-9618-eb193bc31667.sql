ALTER TABLE public.cart_drawer_configs
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Carrinho',
  ADD COLUMN IF NOT EXISTS layout text NOT NULL DEFAULT 'drawer' CHECK (layout IN ('drawer','page'));

ALTER TABLE public.cart_drawer_configs ALTER COLUMN store_id DROP NOT NULL;

ALTER TABLE public.cart_drawer_configs DROP CONSTRAINT IF EXISTS cart_drawer_configs_store_id_key;

CREATE INDEX IF NOT EXISTS idx_cart_drawer_configs_store_assigned
  ON public.cart_drawer_configs(store_id) WHERE store_id IS NOT NULL;