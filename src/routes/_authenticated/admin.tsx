import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { Shield } from "@/components/icon";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin-sidebar";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Shop2Shops" }] }),
  component: AdminLayout,
});

const TITLES: Array<{ match: (p: string) => boolean; label: string }> = [
  { match: (p) => p === "/admin", label: "Visão geral" },
  { match: (p) => p.startsWith("/admin/approvals"), label: "Aprovações de cadastro" },
  { match: (p) => p.startsWith("/admin/users"), label: "Usuários" },
  { match: (p) => p.startsWith("/admin/workspaces"), label: "Workspaces" },
  { match: (p) => p.startsWith("/admin/financial"), label: "Financeiro" },
  { match: (p) => p.startsWith("/admin/plans"), label: "Planos" },
  { match: (p) => p.startsWith("/admin/metrics"), label: "Métricas & Custos" },
  { match: (p) => p.startsWith("/admin/tickets"), label: "Tickets" },
  { match: (p) => p.startsWith("/admin/abuse-reports"), label: "Denúncias" },
];

function AdminLayout() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva para administradores da plataforma Shop2Shops.
        </p>
      </div>
    );
  }

  const title = TITLES.find((t) => t.match(pathname))?.label ?? "Admin";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/80 px-6 py-3 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-base font-semibold">{title}</h1>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-accent ring-1 ring-accent/30">
              <Shield className="h-3 w-3" /> Admin
            </span>
          </header>
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
