import { createFileRoute, Link } from "@tanstack/react-router";
import { SupportThread } from "@/components/support-thread";
import { ArrowLeft } from "@/components/icon";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/_authenticated/dashboard/support/$ticketId")({
  component: TicketPage,
});

function TicketPage() {
  const { ticketId } = Route.useParams();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <Link to="/dashboard/support" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Voltar aos tickets
            </Link>
          </div>
          <SupportThread ticketId={ticketId} asAdmin={false} />
        </main>
      </div>
    </SidebarProvider>
  );
}