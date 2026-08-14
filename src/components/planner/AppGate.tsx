import type { ReactNode } from "react";
import { usePlanner } from "@/lib/planner/store";
import { Onboarding } from "./Onboarding";

/** Muestra el onboarding la primera vez y evita parpadeos durante la hidratación. */
export function AppGate({ children }: { children: ReactNode }) {
  const { state, hydrated } = usePlanner();
  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }
  if (!state.settings.onboarded) return <Onboarding />;
  return <>{children}</>;
}
