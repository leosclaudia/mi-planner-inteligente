import { Link } from "@tanstack/react-router";
import { CalendarDays, Home, ListChecks, MoreHorizontal, NotebookPen } from "lucide-react";

const items = [
  { to: "/", label: "Inicio", icon: Home, exact: true },
  { to: "/calendario", label: "Agenda", icon: CalendarDays, exact: false },
  { to: "/notas", label: "Notas", icon: NotebookPen, exact: false },
  { to: "/tareas", label: "Tareas", icon: ListChecks, exact: false },
  { to: "/mas", label: "Más", icon: MoreHorizontal, exact: false },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/96 shadow-[0_-6px_22px_rgba(85,72,65,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]">
        {items.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2.5 text-muted-foreground transition-all data-[status=active]:bg-terra-soft data-[status=active]:text-foreground"
          >
            <Icon className="h-6 w-6" />
            <span className="truncate text-[13px] font-bold leading-none">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
