import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABEL, statusBadgeClass } from "@/lib/support";
import { Shield } from "@/components/icon";

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
};
type Message = {
  id: string;
  ticket_id: string;
  sender_id: string;
  is_admin: boolean;
  body: string;
  created_at: string;
};

const STATUSES = ["open", "pending_admin", "pending_user", "resolved", "closed"] as const;

export function SupportThread({ ticketId, asAdmin }: { ticketId: string; asAdmin: boolean }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: ticket } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, user_id, subject, category, priority, status, created_at")
        .eq("id", ticketId)
        .single();
      if (error) throw error;
      return data as Ticket;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["ticket-profile", ticket?.user_id],
    enabled: !!ticket?.user_id && asAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("name, email, whatsapp")
        .eq("id", ticket!.user_id)
        .maybeSingle();
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, ticket_id, sender_id, is_admin, body, created_at")
        .eq("ticket_id", ticketId)
        .order("created_at");
      if (error) throw error;
      return data as Message[];
    },
    refetchInterval: 8000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const send = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Não autenticado");
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        sender_id: u.user.id,
        is_admin: asAdmin,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!ticket) return <p className="p-10 text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold md:text-2xl">{ticket.subject}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{ticket.category}</Badge>
              <Badge variant="secondary">{ticket.priority}</Badge>
              <span>Aberto em {new Date(ticket.created_at).toLocaleString("pt-BR")}</span>
            </div>
            {asAdmin && profile && (
              <div className="mt-3 text-xs text-muted-foreground">
                <strong className="text-foreground/85">{profile.name}</strong> · {profile.email}
                {profile.whatsapp ? ` · WhatsApp ${profile.whatsapp}` : ""}
              </div>
            )}
          </div>
          {asAdmin ? (
            <Select value={ticket.status} onValueChange={(v) => updateStatus.mutate(v)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge className={statusBadgeClass(ticket.status)}>
              {STATUS_LABEL[ticket.status as keyof typeof STATUS_LABEL] ?? ticket.status}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {(messages ?? []).map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border p-4 ${
              m.is_admin
                ? "border-primary/30 bg-primary/5"
                : "border-border/60 bg-card/40"
            }`}
          >
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              {m.is_admin ? (
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                  <Shield className="h-3 w-3" /> Suporte Shop2Shops
                </span>
              ) : (
                <span className="font-medium text-foreground/85">{asAdmin ? "Usuário" : "Você"}</span>
              )}
              <span>· {new Date(m.created_at).toLocaleString("pt-BR")}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{m.body}</p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {ticket.status === "closed" ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">Este ticket está fechado.</p>
      ) : (
        <div className="mt-6 rounded-2xl border border-border/60 bg-card/40 p-4">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            maxLength={5000}
            placeholder={asAdmin ? "Responder ao usuário..." : "Escreva sua mensagem..."}
          />
          <div className="mt-3 flex justify-end">
            <Button
              disabled={send.isPending || body.trim().length === 0}
              onClick={() => send.mutate()}
            >
              {send.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}