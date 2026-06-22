
-- Profiles: admin full read
CREATE POLICY "admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Workspaces: admin full read + update (assign plan)
CREATE POLICY "admins read all workspaces" ON public.workspaces
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update all workspaces" ON public.workspaces
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Stores
CREATE POLICY "admins read all stores" ON public.stores
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Distributions
CREATE POLICY "admins read all distributions" ON public.checkout_distributions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Cart sessions
CREATE POLICY "admins read all cart sessions" ON public.cart_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles: admin read/manage all
CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Plans: admin write
CREATE POLICY "admins insert plans" ON public.plans
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update plans" ON public.plans
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete plans" ON public.plans
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
