ALTER TABLE public.store_camouflage_settings
  ADD COLUMN IF NOT EXISTS zoom_origin_x numeric NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS zoom_origin_y numeric NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS applied_product_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];