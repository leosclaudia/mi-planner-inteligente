import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { Button } from "@/components/ui/button";
import { usePlanner } from "@/lib/planner/store";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/imprimir")({
  head: () => ({ meta: [{ title: "Guardar e imprimir | Planner Inteligente" }] }),
  component: () => <AppGate><PrintablePlanner /></AppGate>,
});

type NoteBox = { titleEs: string; titleEn: string; html: string; drawing: string | null };

const noteDefs = [
  { id: "hoy", titleEs: "Hoy", titleEn: "Today" },
  { id: "prioridades", titleEs: "Prioridades", titleEn: "Priorities" },
  { id: "recordatorios", titleEs: "Recordatorios", titleEn: "Reminders" },
  { id: "libre", titleEs: "Lienzo libre", titleEn: "Free canvas" },
] as const;

function PrintablePlanner() {
  const { state } = usePlanner();
  const { lang } = useLanguage();
  const [notes, setNotes] = useState<NoteBox[]>([]);

  useEffect(() => {
    setNotes(noteDefs.map((box) => ({
      titleEs: box.titleEs,
      titleEn: box.titleEn,
      html: localStorage.getItem(`planner-lienzo-${box.id}-v2`) ?? "",
      drawing: localStorage.getItem(`planner-dibujo-${box.id}-v1`),
    })));
  }, []);

  const pending = useMemo(() => state.tasks.filter((task) => !task.done), [state.tasks]);
  const completed = useMemo(() => state.tasks.filter((task) => task.done), [state.tasks]);
  const date = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-AR", { dateStyle: "long" }).format(new Date());
  const es = lang === "es";

  const print = () => window.print();

  return (
    <div className="min-h-screen bg-[#f8f3ec] text-[#302d2a] print:bg-white">
      <style>{`@media print { @page { size: A4; margin: 14mm; } .no-print { display:none !important; } .print-card { break-inside: avoid; box-shadow:none !important; } body { background:white !important; } }`}</style>
      <div className="no-print sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
          <Button variant="outline" asChild><Link to="/mas"><ArrowLeft className="h-4 w-4" />{es ? "Volver" : "Back"}</Link></Button>
          <div className="flex-1" />
          <Button onClick={print}><Printer className="h-4 w-4" />{es ? "Imprimir / Guardar PDF" : "Print / Save PDF"}</Button>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-5 py-8 print:max-w-none print:p-0">
        <header className="mb-7 border-b border-[#d9cbbd] pb-5">
          <p className="text-sm text-muted-foreground">{date}</p>
          <h1 className="mt-1 text-3xl font-bold">{state.settings.plannerName || "Mi Planner"}</h1>
          {state.settings.ownerName ? <p className="mt-1 text-base">{state.settings.ownerName}</p> : null}
          <p className="mt-3 text-sm text-muted-foreground">{es ? "Archivo imprimible de tu planner" : "Printable planner file"}</p>
        </header>

        <section className="mb-7">
          <h2 className="mb-3 text-xl font-bold">{es ? "Tareas pendientes" : "Pending tasks"}</h2>
          {pending.length ? <div className="space-y-2">{pending.map((task) => <TaskLine key={task.id} task={task} es={es} />)}</div> : <Empty text={es ? "No hay tareas pendientes." : "No pending tasks."} />}
        </section>

        <section className="mb-7">
          <h2 className="mb-3 text-xl font-bold">{es ? "Notas" : "Notes"}</h2>
          <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
            {notes.map((box) => (
              <article key={box.titleEs} className="print-card rounded-2xl border border-[#dfd2c7] bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide">{es ? box.titleEs : box.titleEn}</h3>
                {box.html ? <div className="prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: box.html }} /> : <p className="text-sm text-muted-foreground">{es ? "Sin contenido" : "No content"}</p>}
                {box.drawing ? <img src={box.drawing} alt={es ? "Dibujo manuscrito" : "Handwritten drawing"} className="mt-3 max-h-52 w-full object-contain" /> : null}
              </article>
            ))}
          </div>
        </section>

        {state.projects.length ? (
          <section className="mb-7">
            <h2 className="mb-3 text-xl font-bold">{es ? "Proyectos" : "Projects"}</h2>
            <div className="space-y-2">{state.projects.filter((p) => !p.archived).map((project) => <div key={project.id} className="print-card rounded-xl border border-[#dfd2c7] bg-white p-3"><p className="font-semibold">{project.name}</p>{project.description ? <p className="mt-1 text-sm text-muted-foreground">{project.description}</p> : null}</div>)}</div>
          </section>
        ) : null}

        {completed.length ? (
          <section>
            <h2 className="mb-3 text-xl font-bold">{es ? "Tareas completadas" : "Completed tasks"}</h2>
            <div className="space-y-2">{completed.map((task) => <TaskLine key={task.id} task={task} es={es} done />)}</div>
          </section>
        ) : null}

        <footer className="mt-10 border-t border-[#d9cbbd] pt-4 text-xs text-muted-foreground">
          {es ? "Generado desde Mi Planner Inteligente" : "Generated from My Smart Planner"}
        </footer>
      </main>
    </div>
  );
}

function TaskLine({ task, es, done = false }: { task: { title: string; notes: string; date: string | null; priority: string }; es: boolean; done?: boolean }) {
  return <div className="print-card rounded-xl border border-[#dfd2c7] bg-white p-3"><div className="flex items-start gap-2"><span className="mt-0.5 text-sm">{done ? "✓" : "□"}</span><div className="min-w-0 flex-1"><p className={done ? "font-semibold line-through opacity-65" : "font-semibold"}>{task.title}</p>{task.notes ? <p className="mt-1 text-sm text-muted-foreground">{task.notes}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{task.date ? `${es ? "Fecha" : "Date"}: ${task.date} · ` : ""}{es ? "Prioridad" : "Priority"}: {task.priority}</p></div></div></div>;
}

function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-[#dfd2c7] bg-white/70 p-4 text-sm text-muted-foreground">{text}</div>; }
