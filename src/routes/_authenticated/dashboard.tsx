import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TrialGate } from "@/components/trial-gate";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: () => (
    <TrialGate>
      <Outlet />
    </TrialGate>
  ),
});