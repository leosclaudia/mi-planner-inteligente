import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Upload, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { Button } from "@/components/ui/button";
import { usePlanner } from "@/lib/planner/store";
import type { PlannerState } from "@/lib/planner/types";
import { useLanguage } from "@/lib/language";

export const Route = createFileRoute("/respaldo")({ component: () => <AppGate><Backup /></AppGate> });

type BackupFile = {
  app?: string;
  version?: number;
  date?: string;
  state: PlannerState;
  local?: Record<string, string | null>;
};

function validState(value: unknown): value is PlannerState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<PlannerState>;
  return !!state.settings && typeof state.settings === "object" && Array.isArray(state.sections) && Array.isArray(state.projects) && Array.isArray(state.tasks);
}

function normalizeState(state: PlannerState): PlannerState {
  return {
    settings: {
      plannerName: typeof state.settings?.plannerName === "string" ? state.settings.plannerName : "Mi Planner",
      ownerName: typeof state.settings?.ownerName === "string" ? state.settings.ownerName : "",
      onboarded: Boolean(state.settings?.onboarded),
    },
    sections: Array.isArray(state.sections) ? state.sections : [],
    projects: Array.isArray(state.projects) ? state.projects : [],
    tasks: Array.isArray(state.tasks) ? state.tasks : [],
  };
}

function Backup() {
  const { state, replaceState } = usePlanner();
  const { lang } = useLanguage();
  const input = useRef<HTMLInputElement>(null);

  const download = () => {
    const extra = Object.fromEntries(
      Object.keys(localStorage)
        .filter((key) => key.startsWith("planner-"))
        .map((key) => [key, localStorage.getItem(key)]),
    );
    const payload: BackupFile = { app: "mi-planner-inteligente", version: 2, date: new Date().toISOString(), state, local: extra };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `mi-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(lang === "en" ? "Backup downloaded" : "Copia descargada");
  };

  const restore = (file?: File) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error(lang === "en" ? "This backup file is too large" : "Este archivo de copia es demasiado grande");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Partial<BackupFile>;
        if (!validState(data.state)) throw new Error("invalid-state");
        const restored = normalizeState(data.state);
        replaceState(restored);
        if (data.local && typeof data.local === "object") {
          Object.entries(data.local).forEach(([key, value]) => {
            if (key.startsWith("planner-") && typeof value === "string") localStorage.setItem(key, value);
          });
        }
        toast.success(lang === "en" ? "Backup restored" : "Copia restaurada");
        setTimeout(() => location.reload(), 500);
      } catch {
        toast.error(lang === "en" ? "Invalid backup file" : "El archivo de copia no es válido");
      } finally {
        if (input.current) input.current.value = "";
      }
    };
    reader.onerror = () => toast.error(lang === "en" ? "The backup file could not be read" : "No se pudo leer el archivo de copia");
    reader.readAsText(file);
  };

  return <PageShell title={lang === "en" ? "Backup" : "Copia de seguridad"} subtitle={lang === "en" ? "Keep an extra copy of your planner" : "Guardá una copia extra de tu planner"}>
    <section className="card-soft p-5">
      <ShieldCheck className="mb-3 h-8 w-8 text-olive" />
      <h2 className="font-bold">{lang === "en" ? "Download a complete copy" : "Descargar una copia completa"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{lang === "en" ? "Includes planner data, dated notes, canvas notes, drawings, images and language settings saved on this device." : "Incluye datos del planner, notas con fecha, notas del lienzo, dibujos, imágenes e idioma guardados en este equipo."}</p>
      <Button className="mt-4 w-full" onClick={download}><Download className="h-4 w-4" />{lang === "en" ? "Download backup" : "Descargar copia"}</Button>
    </section>
    <section className="card-soft mt-4 p-5">
      <h2 className="font-bold">{lang === "en" ? "Restore a copy" : "Restaurar una copia"}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{lang === "en" ? "Choose a JSON backup previously downloaded from Mi Planner. Older version 1 backups remain compatible." : "Elegí una copia JSON descargada anteriormente desde Mi Planner. Las copias anteriores versión 1 siguen siendo compatibles."}</p>
      <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={(e) => restore(e.target.files?.[0])} />
      <Button variant="outline" className="mt-4 w-full" onClick={() => input.current?.click()}><Upload className="h-4 w-4" />{lang === "en" ? "Choose backup" : "Elegir copia"}</Button>
    </section>
  </PageShell>;
}
