import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Crown, AlertTriangle, BarChart3, ShoppingBag, Mail, Shield, LogOut, ArrowRight,
} from "@/components/icon";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoAsset from "@/assets/shop2shops-logo.png.asset.json";

const items = [
  { title: "Visão geral", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Usuários", url: "/admin/users", icon: Users },
  { title: "Workspaces", url: "/admin/workspaces", icon: ShoppingBag },
  { title: "Planos", url: "/admin/plans", icon: Crown },
  { title: "Métricas & Custos", url: "/admin/metrics", icon: BarChart3 },
  { title: "Tickets", url: "/admin/tickets", icon: Mail },
  { title: "Denúncias", url: "/admin/abuse-reports", icon: AlertTriangle },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta");
    navigate({ to: "/login", replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/admin" className={`flex font-bold ${collapsed ? "items-center justify-center" : "flex-col items-start gap-1.5"}`}>
          <img
            src={logoAsset.url}
            alt="Shop2Shops"
            className={collapsed ? "h-8 w-8 object-contain" : "h-16 w-auto"}
          />
          {!collapsed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-accent ring-1 ring-accent/30">
              <Shield className="h-3 w-3" /> Admin Console
            </span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.exact ? pathname === item.url : pathname.startsWith(item.url);
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/dashboard" className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 rotate-180" />
                {!collapsed && <span>Voltar ao app</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}