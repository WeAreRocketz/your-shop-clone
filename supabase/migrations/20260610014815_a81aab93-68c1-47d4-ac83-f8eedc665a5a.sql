
CREATE TABLE public.oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL,
  state_token TEXT NOT NULL UNIQUE,
  store_type public.store_type NOT NULL DEFAULT 'checkout',
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes')
);
CREATE INDEX oauth_sessions_state_idx ON public.oauth_sessions(state_token);
GRANT SELECT, INSERT, DELETE ON public.oauth_sessions TO authenticated;
GRANT ALL ON public.oauth_sessions TO service_role;
ALTER TABLE public.oauth_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own oauth sessions" ON public.oauth_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.user_id = auth.uid()));
