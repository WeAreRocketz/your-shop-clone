import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "@/components/icon";
import { STATUS_LABEL, statusBadgeClass } from "@/lib/support";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  component: AdminTicketsPage,
});

function AdminTicketsPage() {
  const [statusFilter, setStatusFilter] = useState("active");
  const [q, setQ] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-tickets", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("id, user_id, subject, category, priority, status, last_message_at, created_at")
        .order("last_message_at", { ascending: false });
      if (statusFilter === "active") {
        query = query.in("status", ["open", "pending_admin", "pending_user"]);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const userIds = useMemo(
    () => Array.from(new Set((tickets ?? []).map((t) => t.user_id))),
    [tickets],
  );

  const { data: profiles } = useQuery({
    queryKey: ["admin-tickets-profiles", userIds.join(",")],
    enabled: userIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, name, email").in("id", userIds);
      return data ?? [];
    },
  });

  const profileMap = useMemo(() => new Map((profiles ?? []).map((p) => [p.id, p])), [profiles]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return tickets ?? [];
    return (tickets ?? []).filter((t) => {
      const p = profileMap.get(t.user_id);
      return (
        t.subject.toLowerCase().includes(term) ||
        (p?.email ?? "").toLowerCase().includes(term) ||
        (p?.name ?? "").toLowerCase().includes(term)
      );
    });
  }, [q, tickets, profileMap]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Tickets de suporte</h1>
      <p className="mt-1 text-sm text-muted-foreground">{filtered.length} tickets.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por assunto, email, nome" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativos (open + pendentes)</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="pending_admin">Aguardando suporte</SelectItem>
            <SelectItem value="pending_user">Aguardando usuário</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>}

      <div className="mt-6 space-y-3">
        {filtered.map((t) => {
          const p = profileMap.get(t.user_id);
          return (
            <Link
              key={t.id}
              to="/admin/tickets/$ticketId"
              params={{ ticketId: t.id }}
              className="block rounded-2xl border border-border/60 bg-card/40 p-5 transition hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold">{t.subject}</div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {p?.name ?? "—"} · {p?.email ?? "—"}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{t.category}</Badge>
                    <Badge variant="secondary">{t.priority}</Badge>
                    <span>· {new Date(t.last_message_at).toLocaleString("pt-BR")}</span>
                  </div>
                </div>
                <Badge className={statusBadgeClass(t.status)}>
                  {STATUS_LABEL[t.status as keyof typeof STATUS_LABEL] ?? t.status}
                </Badge>
              </div>
            </Link>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum ticket nesse filtro.</p>
        )}
      </div>
    </div>
  );
}