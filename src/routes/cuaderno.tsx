import { createFileRoute } from "@tanstack/react-router";
import { AppGate } from "@/components/planner/AppGate";
import { BottomNav } from "@/components/planner/BottomNav";
import { Cuaderno } from "@/components/planner/Cuaderno";

export const Route = createFileRoute("/cuaderno")({
  head: () => ({ meta: [{ title: "Cuaderno | Mi Planner" }] }),
  component: () => <AppGate><CuadernoPage /></AppGate>,
});

function CuadernoPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="safe-bottom mx-auto max-w-5xl px-3 pt-5 sm:px-4 sm:pt-7">
        <Cuaderno />
      </main>
      <BottomNav />
    </div>
  );
}
