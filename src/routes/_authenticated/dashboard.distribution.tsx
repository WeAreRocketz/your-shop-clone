import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { StoreRotationTab } from "@/components/store-rotation-tab";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/distribution")({
  head: () => ({ meta: [{ title: "Rotação de checkouts — Shop2Shops" }] }),
  component: DistributionPage,
});

function DistributionPage() {
  const { data: stores } = useQuery({
    queryKey: ["camuflador-stores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, workspace_id, display_name, shopify_domain, store_type, cart_disabled, cart_disabled_reason");
      return data ?? [];
    },
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="flex h-16 items-center gap-4 border-b border-border px-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg font-bold">Rotação de checkouts</h1>
              <p className="text-xs text-muted-foreground">Rodízio automático e proteção das lojas checkout. A configuração principal vive dentro de cada Operação.</p>
            </div>
          </header>
          <div className="p-6">
            <StoreRotationTab stores={stores ?? []} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}