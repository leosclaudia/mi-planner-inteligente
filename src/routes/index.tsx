import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Plus, Settings2, Sparkles, FolderKanban } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { BottomNav } from "@/components/planner/BottomNav";
import { TaskItem } from "@/components/planner/TaskItem";
import { TaskDialog } from "@/components/planner/TaskDialog";
import { SectionIconBox } from "@/components/planner/SectionBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePlanner } from "@/lib/planner/store";
import { KEY, fmt, greeting } from "@/lib/planner/date";
import type { Task } from "@/lib/planner/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Planner Inteligente Personalizable" },
      {
        name: "description",
        content:
          "Agenda personal mobile-first: organizá tu día, semana y mes con secciones y proyectos a tu medida.",
      },
      { property: "og:title", content: "Planner Inteligente Personalizable" },
      {
        property: "og:description",
        content: "Tu planner cálido y personalizable para el día, la semana y el mes.",
      },
    ],
  }),
  component: () => (
    <AppGate>
      <Dashboard />
    </AppGate>
  ),
});

function Dashboard() {
  const { state, visibleSections } = usePlanner();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const today = useMemo(() => new Date(), []);
  const todayKey = KEY(today);

  const todayTasks = state.tasks.filter((t) => t.date === todayKey);
  const pending = todayTasks.filter((t) => !t.done);
  const done = todayTasks.length - pending.length;
  const backlog = state.tasks.filter((t) => !t.done && !t.date);
  const progress = todayTasks.length ? (done / todayTasks.length) * 100 : 0;

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-warm rounded-b-[2rem] px-5 pb-8 pt-10 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
            {fmt(today, "EEEE d 'de' MMMM")}
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            {greeting(today)}
            {state.settings.ownerName ? `, ${state.settings.ownerName}` : ""}
          </h1>
          <p className="mt-1 text-sm opacity-90">{state.settings.plannerName}</p>

          <div className="mt-5 rounded-2xl bg-card/90 p-4 text-foreground shadow-sm">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">Hoy</p>
              <p className="text-sm text-muted-foreground">
                {done}/{todayTasks.length} completadas
              </p>
            </div>
            <Progress value={progress} className="mt-3 h-2" />
            <p className="mt-3 text-sm text-muted-foreground">
              {pending.length === 0
                ? "No tenés pendientes para hoy. ¡Buen momento para planificar!"
                : `Te quedan ${pending.length} pendiente${pending.length > 1 ? "s" : ""} para hoy.`}
            </p>
          </div>
        </div>
      </header>

      <main className="safe-bottom mx-auto max-w-3xl px-4 pt-6">
        <div className="grid grid-cols-2 gap-3">
          <QuickAction to="/calendario" icon={CalendarDays} label="Calendario" />
          <QuickAction to="/asistente" icon={Sparkles} label="Asistente" />
          <QuickAction to="/proyectos" icon={FolderKanban} label="Proyectos" />
          <QuickAction to="/personalizar" icon={Settings2} label="Personalizar" />
        </div>

        <section className="mt-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Pendientes de hoy</h2>
            <Button size="sm" onClick={openNew} className="h-10">
              <Plus className="h-4 w-4" /> Tarea
            </Button>
          </div>
          {todayTasks.length === 0 ? (
            <p className="card-soft mt-3 p-4 text-sm text-muted-foreground">
              Todavía no cargaste tareas para hoy. Tocá “Tarea” para empezar.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {todayTasks.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onEdit={(task) => {
                    setEditing(task);
                    setOpen(true);
                  }}
                />
              ))}
            </ul>
          )}
        </section>

        {backlog.length > 0 ? (
          <section className="mt-7">
            <h2 className="text-xl font-bold">Sin fecha</h2>
            <ul className="mt-3 space-y-2">
              {backlog.slice(0, 4).map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onEdit={(task) => {
                    setEditing(task);
                    setOpen(true);
                  }}
                />
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-7">
          <h2 className="text-xl font-bold">Tus secciones</h2>
          <div className="mt-3 grid gap-2">
            {visibleSections.length === 0 ? (
              <Link to="/personalizar" className="card-soft p-4 text-sm">
                Agregá tus primeras secciones en “Personalizar mi planner”.
              </Link>
            ) : (
              visibleSections.map((s) => {
                const count = state.tasks.filter(
                  (t) => t.sectionId === s.id && !t.done,
                ).length;
                return (
                  <Link
                    key={s.id}
                    to="/tareas"
                    search={{ seccion: s.id }}
                    className="card-soft flex items-center gap-3 p-3"
                  >
                    <SectionIconBox icon={s.icon} color={s.color} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{s.name}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {count} pend.
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>

      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        task={editing}
        defaultDate={editing ? undefined : todayKey}
      />
      <BottomNav />
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
}: {
  to: "/calendario" | "/asistente" | "/proyectos" | "/personalizar";
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link to={to} className="card-soft flex items-center gap-3 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-terra-soft text-terra">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 truncate font-semibold">{label}</span>
    </Link>
  );
}
