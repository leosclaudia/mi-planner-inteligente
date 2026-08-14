import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  FilePenLine,
  FolderKanban,
  Info,
  RotateCcw,
  Settings2,
  Sprout,
} from "lucide-react";
import { toast } from "sonner";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePlanner } from "@/lib/planner/store";
import { OWNER_PRESET_KEYS, SECTION_TEMPLATES, sectionFromTemplate } from "@/lib/planner/templates";

export const Route = createFileRoute("/mas")({
  head: () => ({ meta: [{ title: "Más | Planner Inteligente" }] }),
  component: () => <AppGate><MasPage /></AppGate>,
});

function MasPage() {
  const { state, replaceState, resetAll } = usePlanner();
  const applyOwnerPreset = () => {
    const sections = SECTION_TEMPLATES.filter((t) => OWNER_PRESET_KEYS.includes(t.key)).map((t, i) => sectionFromTemplate(t, i));
    const proyectos = sectionFromTemplate({ key: "proyectos", name: "Proyectos", icon: "wrench", color: "cielo", description: "" }, 0);
    replaceState({ ...state, settings: { ...state.settings, onboarded: true }, sections: [proyectos, ...sections.map((s, i) => ({ ...s, order: i + 1 }))] });
    toast.success("Configuración de ejemplo aplicada");
  };

  return (
    <PageShell title="Más" subtitle={state.settings.plannerName}>
      <div className="grid gap-2">
        <RowLink to="/notas" icon={FilePenLine} label="Notas y lienzo libre" />
        <RowLink to="/proyectos" icon={FolderKanban} label="Proyectos" />
        <RowLink to="/personalizar" icon={Settings2} label="Personalizar mi planner" />
      </div>
      <section className="card-soft mt-6 p-4">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-olive-soft text-olive"><Sprout className="h-5 w-5" /></span><div className="min-w-0"><h2 className="text-base font-bold">Configuración de ejemplo</h2><p className="mt-1 text-sm text-muted-foreground">Carga las secciones Proyectos, Huerta, Pedidos/Ventas y Contenido. Es opcional.</p></div></div>
        <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="mt-4 h-12 w-full">Aplicar preset de ejemplo</Button></AlertDialogTrigger><AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>¿Reemplazar tus secciones?</AlertDialogTitle><AlertDialogDescription>Tus tareas y proyectos se conservan, pero las secciones actuales se reemplazan.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="h-12">Cancelar</AlertDialogCancel><AlertDialogAction className="h-12" onClick={applyOwnerPreset}>Aplicar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </section>
      <section className="card-soft mt-4 p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground"><Info className="h-5 w-5" /></span><p className="min-w-0 text-sm text-muted-foreground">Tus datos se guardan en este navegador. Si cerrás la app y volvés, todo sigue donde lo dejaste.</p></div></section>
      <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="mt-4 h-12 w-full text-destructive"><RotateCcw className="h-4 w-4" /> Borrar todos mis datos</Button></AlertDialogTrigger><AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>¿Empezar de cero?</AlertDialogTitle><AlertDialogDescription>Se borran secciones, tareas y proyectos de este navegador. No se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="h-12">Cancelar</AlertDialogCancel><AlertDialogAction className="h-12" onClick={() => resetAll()}>Borrar todo</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </PageShell>
  );
}

function RowLink({ to, icon: Icon, label }: { to: "/notas" | "/proyectos" | "/personalizar"; icon: React.ElementType; label: string }) {
  return <Link to={to} className="card-soft flex items-center gap-3 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-terra-soft text-terra"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1 truncate font-semibold">{label}</span><ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" /></Link>;
}
