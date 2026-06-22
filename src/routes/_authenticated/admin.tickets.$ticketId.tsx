import { createFileRoute, Link } from "@tanstack/react-router";
import { SupportThread } from "@/components/support-thread";
import { ArrowLeft } from "@/components/icon";

export const Route = createFileRoute("/_authenticated/admin/tickets/$ticketId")({
  component: AdminTicketPage,
});

function AdminTicketPage() {
  const { ticketId } = Route.useParams();
  return (
    <div>
      <div className="border-b border-border/60 bg-background/80 px-6 py-3">
        <Link to="/admin/tickets" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar aos tickets
        </Link>
      </div>
      <SupportThread ticketId={ticketId} asAdmin={true} />
    </div>
  );
}