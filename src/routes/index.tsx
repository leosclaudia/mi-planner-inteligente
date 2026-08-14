import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  Plus,
  Settings2,
  Sparkles,
  Star,
} from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { BottomNav } from "@/components/planner/BottomNav";
import { TaskItem } from "@/components/planner/TaskItem";
import { TaskDialog } from "@/components/planner/TaskDialog";
import { SectionIconBox } from "@/components/planner/SectionBadge";
import { Button } from "@/components/ui/button";
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
  const pendingToday = todayTasks.filter((t) => !t.done);
  const completedToday = todayTasks.filter((t) => t.done);
  const allPending = state.tasks.filter((t) => !t.done);
  const priority = pendingToday[0] ?? allPending[0] ?? null;
  const upcoming = state.tasks
    .filter((t) => !t.done && t.date && t.date >= todayKey)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))
    .slice(0, 3);

  const openNew = () => {
    setEditing(null);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="px-5 pb-5 pt-7 sm:pt-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-base font-semibold text-primary">
            {fmt(today, "EEEE d 'de' MMMM")}
          </p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight text-foreground sm:text-4xl">
            {greeting(today)}
            {state.settings.ownerName ? `, ${state.settings.ownerName}` : ""}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">{state.settings.plannerName}</p>
        </div>
      </header>

      <main className="safe-bottom mx-auto max-w-3xl px-4 pb-4">
        <section className="card-soft flex items-center justify-between gap-3 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <CalendarDays className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-base font-bold capitalize">{fmt(today, "EEEE d 'de' MMMM")}</p>
              <p className="text-sm text-muted-foreground">Tu día de hoy</p>
            </div>
          </div>
          <Link
            to="/calendario"
            className="shrink-0 rounded-xl border border-primary px-3 py-2 text-sm font-bold text-primary"
          >
            Ver día
          </Link>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={ListChecks} value={allPending.length} label="Pendientes" tone="green" />
          <StatCard icon={CheckCircle2} value={completedToday.length} label="Completadas" tone="warm" />
          <StatCard icon={CalendarDays} value={todayTasks.length} label="Hoy" tone="green" />
          <StatCard icon={FolderKanban} value={state.projects.length} label="Proyectos" tone="warm" />
        </section>

        <section className="mt-5 rounded-[1.4rem] bg-primary p-3 shadow-[0_12px_30px_rgba(38,53,46,0.14)]">
          <div className="flex items-center gap-2 px-1 pb-3 text-primary-foreground">
            <Star className="h-5 w-5" />
            <h2 className="text-xl font-bold text-primary-foreground">Prioridad de hoy</h2>
          </div>
          <div className="rounded-2xl bg-card p-4">
            {priority ? (
              <button
                className="w-full text-left"
                onClick={() => {
                  setEditing(priority);
                  setOpen(true);
                }}
              >
                <p className="text-lg font-semibold leading-snug">{priority.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">Tocá para editar o completar</p>
              </button>
            ) : (
              <div>
                <p className="text-lg font-semibold">Todavía no elegiste una prioridad.</p>
                <button onClick={openNew} className="mt-2 text-base font-bold text-primary">
                  + Agregar una tarea para hoy
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-bold">Accesos rápidos</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <QuickAction onClick={openNew} icon={Plus} label="Agregar tarea" />
            <QuickLink to="/calendario" icon={CalendarDays} label="Mi calendario" />
            <QuickLink to="/proyectos" icon={FolderKanban} label="Proyectos" />
            <QuickLink to="/personalizar" icon={Settings2} label="Mis secciones" />
            <QuickLink to="/asistente" icon={Sparkles} label="Asistente" />
            <QuickLink to="/tareas" icon={ListChecks} label="Todas las tareas" />
          </div>
        </section>

        <section className="mt-6 rounded-[1.4rem] border border-border/80 bg-secondary/55 p-4">
          <p className="text-lg font-bold">Pequeños pasos, grandes cambios</p>
          <p className="mt-1 text-base text-muted-foreground">
            Cada acción que organizás hoy te deja más espacio para lo importante.
          </p>
        </section>

        <section className="mt-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Próximas tareas</h2>
            <Link to="/calendario" className="text-sm font-bold text-primary">
              Ver calendario
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="card-soft mt-3 p-4 text-base text-muted-foreground">
              No hay tareas próximas. Podés agregar una cuando quieras.
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((t) => (
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

        <section className="mt-7">
          <h2 className="text-2xl font-bold">Tus secciones</h2>
          <div className="mt-3 grid gap-2">
            {visibleSections.length === 0 ? (
              <Link to="/personalizar" className="card-soft p-4 text-base">
                Agregá tus primeras secciones en “Personalizar mi planner”.
              </Link>
            ) : (
              visibleSections.map((s) => {
                const count = state.tasks.filter((t) => t.sectionId === s.id && !t.done).length;
                return (
                  <Link
                    key={s.id}
                    to="/tareas"
                    search={{ seccion: s.id }}
                    className="card-soft flex items-center gap-3 p-4"
                  >
                    <SectionIconBox icon={s.icon} color={s.color} />
                    <span className="min-w-0 flex-1 truncate text-base font-bold">{s.name}</span>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
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

function StatCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  tone: "green" | "warm";
}) {
  return (
    <div className={`card-soft p-4 ${tone === "green" ? "bg-secondary/55" : "bg-terra-soft/65"}`}>
      <Icon className={`h-6 w-6 ${tone === "green" ? "text-primary" : "text-terra"}`} />
      <p className="mt-3 text-3xl font-bold leading-none">{value}</p>
      <p className="mt-2 text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: "/calendario" | "/asistente" | "/proyectos" | "/personalizar" | "/tareas";
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link to={to} className="card-soft flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <span className="text-base font-bold">{label}</span>
    </Link>
  );
}

function QuickAction({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button onClick={onClick} className="card-soft flex min-h-24 flex-col items-center justify-center gap-2 p-4 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-terra-soft text-terra">
        <Icon className="h-6 w-6" />
      </span>
      <span className="text-base font-bold">{label}</span>
    </button>
  );
}
