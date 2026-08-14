import { Link } from "@tanstack/react-router";
import { CalendarDays, Home, ListChecks, MoreHorizontal, Sparkles } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/calendario", label: "Calendario", icon: CalendarDays, exact: false },
  { to: "/tareas", label: "Tareas", icon: ListChecks, exact: false },
  { to: "/asistente", label: "Asistente", icon: Sparkles, exact: false },
  { to: "/mas", label: "Más", icon: MoreHorizontal, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            className="group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-muted-foreground transition-colors data-[status=active]:text-primary"
          >
            <span className="rounded-full px-3 py-1 transition-colors group-data-[status=active]:bg-terra-soft">
              <Icon className="h-5 w-5" />
            </span>
            <span className="truncate text-[11px] font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
