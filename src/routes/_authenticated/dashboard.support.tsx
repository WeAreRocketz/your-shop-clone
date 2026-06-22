import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Mail } from "@/components/icon";
import { STATUS_LABEL, statusBadgeClass } from "@/lib/support";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export const Route = createFileRoute("/_authenticated/dashboard/support")({
  head: () => ({ meta: [{ title: "Suporte — Shop2Shops" }] }),
  component: SupportListPage,
});

function SupportListPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, subject, category, priority, status, last_message_at, created_at")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({ user_id: u.user.id, subject, category, priority })
        .select("id")
        .single();
      if (error) throw error;
      const { error: msgErr } = await supabase
        .from("support_messages")
        .insert({ ticket_id: ticket.id, sender_id: u.user.id, is_admin: false, body });
      if (msgErr) throw msgErr;
      return ticket.id;
    },
    onSuccess: (id) => {
      toast.success("Ticket aberto");
      setOpen(false);
      setSubject(""); setBody(""); setCategory("general"); setPriority("normal");
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
      navigate({ to: "/dashboard/support/$ticketId", params: { ticketId: id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-semibold">Suporte</h1>
                <p className="text-sm text-muted-foreground">Seus tickets de atendimento.</p>
              </div>
            </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-1 h-4 w-4" /> Novo ticket</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Abrir novo ticket</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Assunto</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Resumo do problema" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="billing">Pagamento</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="account">Conta</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Prioridade</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} maxLength={5000} placeholder="Conte o que está acontecendo, passos para reproduzir, prints, etc." />
              </div>
              <Button
                className="w-full"
                disabled={create.isPending || subject.trim().length < 3 || body.trim().length === 0}
                onClick={() => create.mutate()}
              >
                {create.isPending ? "Abrindo..." : "Abrir ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {!isLoading && (tickets ?? []).length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <Mail className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Você ainda não abriu nenhum ticket.</p>
        </div>
      )}
      <div className="space-y-3">
        {(tickets ?? []).map((t) => (
          <Link
            key={t.id}
            to="/dashboard/support/$ticketId"
            params={{ ticketId: t.id }}
            className="block rounded-2xl border border-border/60 bg-card/40 p-5 transition hover:border-primary/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{t.subject}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{t.category}</Badge>
                  <Badge variant="secondary">{t.priority}</Badge>
                  <span>· última atividade {new Date(t.last_message_at).toLocaleString("pt-BR")}</span>
                </div>
              </div>
              <Badge className={statusBadgeClass(t.status)}>{STATUS_LABEL[t.status as keyof typeof STATUS_LABEL] ?? t.status}</Badge>
            </div>
          </Link>
        ))}
      </div>
        </main>
      </div>
    </SidebarProvider>
  );
}