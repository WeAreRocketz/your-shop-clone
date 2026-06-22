export const STATUS_LABEL = {
  open: "Aberto",
  pending_admin: "Aguardando suporte",
  pending_user: "Aguardando você",
  resolved: "Resolvido",
  closed: "Fechado",
} as const;

export function statusBadgeClass(status: string) {
  switch (status) {
    case "open":
    case "pending_admin":
      return "bg-primary/15 text-primary ring-1 ring-primary/30";
    case "pending_user":
      return "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30";
    case "resolved":
      return "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30";
    case "closed":
    default:
      return "bg-muted text-muted-foreground";
  }
}