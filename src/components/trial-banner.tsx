import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { useWorkspacePlan } from "@/hooks/use-workspace-plan";

export function TrialBanner() {
  const { data } = useWorkspacePlan();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !data?.trialExpired) return null;

  return createPortal(
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-yellow-500/95 px-4 py-2 text-sm text-yellow-950 shadow">
      <AlertTriangle className="h-4 w-4" />
      <span>Seu período de teste de 14 dias expirou. Faça upgrade para continuar criando mapeamentos e usando o carrinho.</span>
      <Button asChild size="sm" variant="secondary">
        <Link to="/dashboard/settings">Fazer upgrade</Link>
      </Button>
    </div>,
    document.body,
  );
}