
-- 1) Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 2) Abuse reports
CREATE TABLE public.abuse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL,
  reporter_email text NOT NULL,
  target_url text,
  category text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.abuse_reports TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.abuse_reports TO authenticated;
GRANT ALL ON public.abuse_reports TO service_role;

ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can report abuse"
ON public.abuse_reports FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(reporter_name) BETWEEN 1 AND 120
  AND length(reporter_email) BETWEEN 3 AND 255
  AND length(category) BETWEEN 1 AND 60
  AND length(description) BETWEEN 10 AND 4000
  AND (target_url IS NULL OR length(target_url) <= 500)
);

CREATE POLICY "Admins read abuse reports"
ON public.abuse_reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update abuse reports"
ON public.abuse_reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete abuse reports"
ON public.abuse_reports FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER abuse_reports_updated_at
BEFORE UPDATE ON public.abuse_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
