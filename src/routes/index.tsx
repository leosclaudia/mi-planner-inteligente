import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ListChecks, NotebookPen, Sparkles } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { BottomNav } from "@/components/planner/BottomNav";
import { usePlanner } from "@/lib/planner/store";
import { fmt } from "@/lib/planner/date";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/")({ head: () => ({ meta: [{ title: "Planner Inteligente Personalizable" }] }), component: () => <AppGate><InicioSimple /></AppGate> });

function InicioSimple() {
  const { state } = usePlanner();
  const { t, lang } = useLanguage();
  const today = new Date();
  const pending = state.tasks.filter((task) => !task.done).length;
  const dateText = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-AR", { weekday: "long", day: "numeric", month: "long" }).format(today);
  return (
    <div className="min-h-screen bg-background">
      <main className="safe-bottom mx-auto max-w-3xl px-4 pt-8">
        <header className="mb-6">
          <p className="text-sm font-semibold capitalize text-muted-foreground">{dateText}</p>
          <h1 className="mt-1 text-[30px] font-bold leading-tight">{state.settings.plannerName || "Mi Planner"}</h1>
          <p className="mt-1 text-base text-muted-foreground">{t("Un espacio simple para organizar, escribir y recordar.")}</p>
        </header>
        <section className="grid gap-3">
          <Link to="/calendario" className="card-soft flex items-center gap-4 p-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-terra-soft text-terra"><CalendarDays className="h-6 w-6" /></span><div className="min-w-0"><h2 className="text-xl font-bold">{t("Agenda")}</h2><p className="text-sm text-muted-foreground">{t("Día, semana y fechas importantes")}</p></div></Link>
          <Link to="/notas" className="card-soft flex items-center gap-4 p-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-plum-soft text-plum"><NotebookPen className="h-6 w-6" /></span><div className="min-w-0"><h2 className="text-xl font-bold">{t("Notas")}</h2><p className="text-sm text-muted-foreground">{t("Escribí, pegá imágenes, stickers o dibujá")}</p></div></Link>
          <Link to="/tareas" className="card-soft flex items-center gap-4 p-5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sun-soft text-sun"><ListChecks className="h-6 w-6" /></span><div className="min-w-0 flex-1"><h2 className="text-xl font-bold">{t("Tareas")}</h2><p className="text-sm text-muted-foreground">{pending ? (lang === "en" ? `${pending} pending` : `${pending} pendientes`) : t("Sin pendientes")}</p></div></Link>
        </section>
        <section className="mt-5 rounded-[1.3rem] border border-border bg-card p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cielo-soft text-cielo"><Sparkles className="h-5 w-5" /></span><div><h2 className="text-lg font-bold">{t("Asistente")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("Lo dejamos disponible, pero fuera del camino principal para que el planner siga simple.")}</p><Link to="/asistente" className="mt-2 inline-block text-sm font-bold text-foreground underline underline-offset-4">{t("Abrir asistente")}</Link></div></div></section>
      </main><BottomNav />
    </div>
  );
}
