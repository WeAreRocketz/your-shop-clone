import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Store, Package, Shuffle, ShoppingCart, Settings, LogOut, Target, Shield, Mail, Receipt, Wand2,
} from "@/components/icon";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrialBanner } from "@/components/trial-banner";
import { useWorkspacePlan } from "@/hooks/use-workspace-plan";
import { useQuery } from "@tanstack/react-query";
import { useIsAdmin } from "@/hooks/use-is-admin";
import logoAsset from "@/assets/shop2shops-logo.png.asset.json";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Conectar Lojas", url: "/dashboard/stores", icon: Store },
  { title: "Financeiro por Loja", url: "/dashboard/finance", icon: Receipt },
  { title: "Operações", url: "/dashboard/products", icon: Package },
  { title: "Camuflador", url: "/dashboard/camuflador", icon: Wand2 },
  { title: "Rotação de checkouts", url: "/dashboard/distribution", icon: Shuffle },
  { title: "Carrinho Personalizado", url: "/dashboard/cart", icon: ShoppingCart },
  { title: "Tracking & Pixels", url: "/dashboard/tracking", icon: Target },
  { title: "Suporte", url: "/dashboard/support", icon: Mail },
  { title: "Configurações", url: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data: isAdmin } = useIsAdmin();

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta");
    navigate({ to: "/login", replace: true });
  }

  return (
    <>
    <TrialBanner />
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/dashboard" className={`flex font-bold ${collapsed ? "items-center justify-center" : "flex-col items-start gap-1.5"}`}>
          <img
            src={logoAsset.url}
            alt="Shop2Shops"
            className={collapsed ? "h-8 w-8 object-contain" : "h-16 w-auto"}
          />
          {!collapsed && (
            <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-muted-foreground">
              <span>Conecte</span>
              <span className="h-1 w-1 rounded-full bg-primary shadow-[0_0_4px_var(--color-primary)]" />
              <span>Gerencie</span>
              <span className="h-1 w-1 rounded-full bg-primary shadow-[0_0_4px_var(--color-primary)]" />
              <span>Escale</span>
            </p>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title} className="relative">
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="relative rounded-[4px] !transition-[background-color,color] !duration-[160ms] !ease-[ease] bg-transparent text-white/50 font-normal hover:!bg-gradient-to-r hover:!from-white/[0.06] hover:!to-transparent hover:!text-white/85 data-[active=true]:!bg-gradient-to-r data-[active=true]:!from-[rgba(163,255,18,0.13)] data-[active=true]:!to-transparent data-[active=true]:!text-primary data-[active=true]:font-medium"
                    >
                      <Link to={item.url} className="flex items-center gap-2">
                        {active && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-[3px] bg-primary"
                          />
                        )}
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {isAdmin && (
                <SidebarMenuItem className="relative">
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/admin")}
                    className="relative rounded-[4px] !transition-[background-color,color] !duration-[160ms] !ease-[ease] bg-transparent text-accent font-normal hover:!bg-gradient-to-r hover:!from-white/[0.06] hover:!to-transparent hover:!text-accent data-[active=true]:!bg-gradient-to-r data-[active=true]:!from-[rgba(163,255,18,0.13)] data-[active=true]:!to-transparent data-[active=true]:!text-primary data-[active=true]:font-medium"
                  >
                    <Link to="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {!collapsed && <span>Admin</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border gap-2">
        {!collapsed && <SidebarPlanCard />}
        {!collapsed && <SidebarUserCard />}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
    </>
  );
}

function SidebarPlanCard() {
  const { data } = useWorkspacePlan();
  const { data: storeCounts } = useQuery({
    queryKey: ["sidebar-store-counts", data?.workspaceId],
    enabled: !!data?.workspaceId,
    queryFn: async () => {
      const ws = data!.workspaceId;
      const [v, c] = await Promise.all([
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("workspace_id", ws).eq("store_type", "vitrine"),
        supabase.from("stores").select("id", { count: "exact", head: true }).eq("workspace_id", ws).eq("store_type", "checkout"),
      ]);
      return { vitrine: v.count ?? 0, checkout: c.count ?? 0 };
    },
  });

  const planName = data?.plan?.name ?? "Plano Trial";
  const renewsAt = data?.trialEndsAt ? new Date(data.trialEndsAt) : null;
  const daysLeft = renewsAt ? Math.max(0, Math.ceil((renewsAt.getTime() - Date.now()) / 86400000)) : null;
  const maxStores = data?.plan?.max_stores ?? null;
  const vit = storeCounts?.vitrine ?? 0;
  const chk = storeCounts?.checkout ?? 0;
  const vitPct = maxStores ? Math.min(100, (vit / maxStores) * 100) : 0;
  const chkPct = maxStores ? Math.min(100, (chk / maxStores) * 100) : 0;

  return (
    <Link
      to="/dashboard/settings"
      className="block rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-3 transition hover:bg-sidebar-accent/60"
    >
      <div className="text-sm font-semibold text-sidebar-foreground">{planName}</div>
      {daysLeft !== null && (
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {data?.plan?.is_trial ? "Trial expira" : "Renova"} em {daysLeft} dia{daysLeft === 1 ? "" : "s"}
        </div>
      )}
      <div className="mt-3 space-y-2">
        <PlanBar label="Lojas vitrine" used={vit} max={maxStores} pct={vitPct} />
        <PlanBar label="Lojas checkout" used={chk} max={maxStores} pct={chkPct} />
      </div>
    </Link>
  );
}

function PlanBar({ label, used, max, pct }: { label: string; used: number; max: number | null; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span className="tabular-nums">{used}{max ? ` / ${max}` : ""}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, var(--color-primary), color-mix(in oklab, var(--color-primary) 60%, transparent))",
            boxShadow: "0 0 8px color-mix(in oklab, var(--color-primary) 60%, transparent)",
          }}
        />
      </div>
    </div>
  );
}

function SidebarUserCard() {
  const { data } = useQuery({
    queryKey: ["sidebar-user"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: p } = await supabase.from("profiles").select("name, email").eq("id", u.user.id).maybeSingle();
      return { email: p?.email ?? u.user.email ?? "", name: p?.name || (u.user.email ?? "").split("@")[0] };
    },
  });
  if (!data) return null;
  const initial = (data.name || data.email || "?").slice(0, 1).toUpperCase();
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary ring-1 ring-primary/30">
        {initial}
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-sidebar-foreground">{data.name}</div>
        <div className="truncate text-[10px] text-muted-foreground">{data.email}</div>
      </div>
    </div>
  );
}
