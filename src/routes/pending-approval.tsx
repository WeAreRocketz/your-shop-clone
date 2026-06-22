import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, XCircle, LogOut } from "lucide-react";

export const Route = createFileRoute("/pending-approval")({
  component: PendingApprovalPage,
});

function PendingApprovalPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "rejected" | "approved" | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        navigate({ to: "/login" });
        return;
      }
      setEmail(u.user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("approval_status, rejection_reason")
        .eq("id", u.user.id)
        .maybeSingle();
      if (data) {
        setStatus(data.approval_status as any);
        setReason(data.rejection_reason);
        if (data.approval_status === "approved") navigate({ to: "/dashboard" });
      }
    })();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const isRejected = status === "rejected";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <div className="flex justify-center">
          {isRejected ? (
            <XCircle className="h-14 w-14 text-destructive" />
          ) : (
            <Clock className="h-14 w-14 text-primary" />
          )}
        </div>
        <h1 className="text-2xl font-bold">
          {isRejected ? "Cadastro recusado" : "Aguardando aprovação"}
        </h1>
        <p className="text-muted-foreground">
          {isRejected
            ? "Seu cadastro foi recusado pela administração."
            : "Seu cadastro foi recebido e está em análise. Você receberá acesso assim que for aprovado."}
        </p>
        {isRejected && reason && (
          <div className="text-sm bg-destructive/10 text-destructive rounded-md p-3 text-left">
            <strong>Motivo:</strong> {reason}
          </div>
        )}
        {email && <p className="text-xs text-muted-foreground">Conta: {email}</p>}
        <div className="flex flex-col gap-2 pt-2">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
          <Link to="/" className="text-xs text-muted-foreground hover:underline">
            Voltar para o site
          </Link>
        </div>
      </Card>
    </div>
  );
}
