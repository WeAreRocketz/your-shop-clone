ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS client_secret text,
  ADD COLUMN IF NOT EXISTS cached_token text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;