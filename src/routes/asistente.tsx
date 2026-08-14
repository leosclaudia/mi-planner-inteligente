import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlanner } from "@/lib/planner/store";
import { organizeBrainDump, type SuggestedTask } from "@/lib/planner/assistant";
import { KEY, addDays } from "@/lib/planner/date";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/asistente")({
  head: () => ({
    meta: [
      { title: "Asistente | Planner Inteligente" },
      {
        name: "description",
        content:
          "Escribí tus pendientes desordenados y convertilos en un plan organizado por día y prioridad.",
      },
      { property: "og:title", content: "Asistente | Planner Inteligente" },
      {
        property: "og:description",
        content: "De la lluvia de ideas a un plan claro en un toque.",
      },
    ],
  }),
  component: () => (
    <AppGate>
      <AsistentePage />
    </AppGate>
  ),
});

const NONE = "__none__";
const DAY_LABEL = { hoy: "Hoy", manana: "Mañana", semana: "Esta semana" } as const;

function AsistentePage() {
  const { visibleSections, addTask } = usePlanner();
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestedTask[] | null>(null);

  const run = async () => {
    if (!raw.trim()) return;
    setLoading(true);
    const out = await organizeBrainDump(raw, visibleSections);
    setResult(out);
    setLoading(false);
  };

  const update = (i: number, patch: Partial<SuggestedTask>) =>
    setResult((r) => r?.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) ?? r);

  const accept = () => {
    if (!result) return;
    const today = new Date();
    for (const s of result) {
      addTask({
        title: s.title,
        priority: s.priority,
        sectionId: s.sectionId,
        date:
          s.day === "hoy"
            ? KEY(today)
            : s.day === "manana"
              ? KEY(addDays(today, 1))
              : null,
      });
    }
    toast.success(`${result.length} tareas agregadas a tu planner`);
    setResult(null);
    setRaw("");
  };

  return (
    <PageShell title="Asistente" subtitle="Ordená tus pendientes en segundos">
      <div className="card-soft flex items-start gap-3 p-4">
        <span className="gradient-warm grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </span>
        <p className="min-w-0 text-sm text-muted-foreground">
          Escribí todo lo que tenés en la cabeza, sin orden. El asistente lo transforma en
          una propuesta de tareas con día, prioridad y sección. Podés ajustar todo antes de
          guardarlo.
        </p>
      </div>

      <Textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={7}
        className="mt-4"
        placeholder={"Ej:\nllamar a la contadora urgente\nregar la huerta\ngrabar video para contenido mañana"}
      />
      <Button className="mt-3 h-12 w-full" onClick={run} disabled={!raw.trim() || loading}>
        <Wand2 className="h-4 w-4" />
        {loading ? "Organizando…" : "Organizar mis pendientes"}
      </Button>

      {result ? (
        <section className="mt-6">
          <h2 className="text-xl font-bold">Propuesta ({result.length})</h2>
          <ul className="mt-3 space-y-2">
            {result.map((s, i) => (
              <li key={i} className="card-soft space-y-3 p-3">
                <p className="font-semibold">{s.title}</p>
                <div className="flex flex-wrap gap-2">
                  {(["hoy", "manana", "semana"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => update(i, { day: d })}
                      className={cn(
                        "rounded-full border border-border px-3 py-1.5 text-xs font-semibold",
                        s.day === d && "bg-primary text-primary-foreground",
                      )}
                    >
                      {DAY_LABEL[d]}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={s.priority}
                    onValueChange={(v) =>
                      update(i, { priority: v as SuggestedTask["priority"] })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={s.sectionId ?? NONE}
                    onValueChange={(v) => update(i, { sectionId: v === NONE ? null : v })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Sin sección" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Sin sección</SelectItem>
                      {visibleSections.map((sec) => (
                        <SelectItem key={sec.id} value={sec.id}>
                          {sec.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  className="text-sm font-semibold text-destructive"
                  onClick={() => setResult((r) => r?.filter((_, idx) => idx !== i) ?? r)}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <Button className="mt-4 h-12 w-full" onClick={accept} disabled={!result.length}>
            Agregar todo a mi planner
          </Button>
        </section>
      ) : null}
    </PageShell>
  );
}
