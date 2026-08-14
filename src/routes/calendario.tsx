import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addMonths, isSameDay, isSameMonth, isToday, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { TaskItem } from "@/components/planner/TaskItem";
import { TaskDialog } from "@/components/planner/TaskDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlanner } from "@/lib/planner/store";
import { KEY, addDays, fmt, monthGrid, weekDays } from "@/lib/planner/date";
import type { Task } from "@/lib/planner/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendario | Planner Inteligente" },
      {
        name: "description",
        content: "Navegá tu agenda por día, semana y mes con tus tareas siempre a la vista.",
      },
      { property: "og:title", content: "Calendario | Planner Inteligente" },
      {
        property: "og:description",
        content: "Vista de día, semana y mes con navegación real.",
      },
    ],
  }),
  component: () => (
    <AppGate>
      <CalendarioPage />
    </AppGate>
  ),
});

type View = "dia" | "semana" | "mes";

function CalendarioPage() {
  const { state } = usePlanner();
  const [view, setView] = useState<View>("dia");
  const [cursor, setCursor] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const byDay = useMemo(() => {
    const m: Record<string, Task[]> = {};
    for (const t of state.tasks) {
      if (!t.date) continue;
      (m[t.date] ??= []).push(t);
    }
    return m;
  }, [state.tasks]);

  const step = (dir: -1 | 1) => {
    if (view === "dia") setCursor((d) => addDays(d, dir));
    else if (view === "semana") setCursor((d) => addDays(d, 7 * dir));
    else setCursor((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
  };

  const label =
    view === "mes"
      ? fmt(cursor, "MMMM yyyy")
      : view === "semana"
        ? `Semana del ${fmt(weekDays(cursor)[0]!, "d MMM")}`
        : fmt(cursor, "EEEE d 'de' MMMM");

  const onEdit = (t: Task) => {
    setEditing(t);
    setOpen(true);
  };

  return (
    <PageShell
      title="Calendario"
      subtitle={state.settings.plannerName}
      action={
        <Button
          className="h-11"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Tarea
        </Button>
      }
    >
      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dia">Día</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mes</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Button size="icon" variant="outline" aria-label="Anterior" onClick={() => step(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <p className="min-w-0 flex-1 truncate text-center font-semibold capitalize">
          {label}
        </p>
        <Button size="icon" variant="outline" aria-label="Siguiente" onClick={() => step(1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="mt-2 text-center">
        <button
          className="text-sm font-semibold text-primary"
          onClick={() => setCursor(new Date())}
        >
          Ir a hoy
        </button>
      </div>

      {view === "dia" ? (
        <DayList tasks={byDay[KEY(cursor)] ?? []} onEdit={onEdit} />
      ) : view === "semana" ? (
        <div className="mt-4 space-y-4">
          {weekDays(cursor).map((d) => (
            <div key={KEY(d)}>
              <div className="flex items-center gap-2">
                <h2
                  className={cn(
                    "text-base font-bold capitalize",
                    isToday(d) && "text-primary",
                  )}
                >
                  {fmt(d, "EEEE d")}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {(byDay[KEY(d)] ?? []).length} tareas
                </span>
              </div>
              <DayList tasks={byDay[KEY(d)] ?? []} onEdit={onEdit} compact />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthGrid(cursor).map((d) => {
              const list = byDay[KEY(d)] ?? [];
              const selected = isSameDay(d, cursor);
              return (
                <button
                  key={KEY(d)}
                  onClick={() => {
                    setCursor(d);
                    setView("dia");
                  }}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center rounded-xl border border-transparent text-sm",
                    isSameMonth(d, cursor) ? "text-foreground" : "text-muted-foreground/50",
                    isToday(d) && "border-primary font-bold",
                    selected && "bg-terra-soft",
                  )}
                >
                  {d.getDate()}
                  {list.length > 0 ? (
                    <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        task={editing}
        defaultDate={editing ? undefined : KEY(cursor)}
      />
    </PageShell>
  );
}

function DayList({
  tasks,
  onEdit,
  compact,
}: {
  tasks: Task[];
  onEdit: (t: Task) => void;
  compact?: boolean;
}) {
  if (tasks.length === 0)
    return (
      <p
        className={cn(
          "card-soft p-4 text-sm text-muted-foreground",
          compact ? "mt-2" : "mt-4",
        )}
      >
        Sin tareas para este día.
      </p>
    );
  return (
    <ul className={cn("space-y-2", compact ? "mt-2" : "mt-4")}>
      {tasks.map((t) => (
        <TaskItem key={t.id} task={t} onEdit={onEdit} />
      ))}
    </ul>
  );
}
