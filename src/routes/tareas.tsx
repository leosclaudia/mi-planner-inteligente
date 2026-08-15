import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Printer } from "lucide-react";
import { z } from "zod";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { TaskItem } from "@/components/planner/TaskItem";
import { TaskDialog } from "@/components/planner/TaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlanner } from "@/lib/planner/store";
import type { Task } from "@/lib/planner/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language";

const searchSchema = z.object({ seccion: z.string().optional() });
export const Route = createFileRoute("/tareas")({ validateSearch: searchSchema, head: () => ({ meta: [{ title: "Tareas | Planner Inteligente" }] }), component: () => <AppGate><TareasPage /></AppGate> });

function TareasPage() {
  const { state, visibleSections } = usePlanner(); const { t, lang } = useLanguage(); const { seccion } = Route.useSearch(); const navigate = Route.useNavigate();
  const [filter,setFilter]=useState<"pendientes"|"hechas"|"todas">("pendientes"); const [q,setQ]=useState(""); const [open,setOpen]=useState(false); const [editing,setEditing]=useState<Task|null>(null);
  const tasks=state.tasks.filter(task=>(seccion?task.sectionId===seccion:true)).filter(task=>filter==="todas"?true:filter==="hechas"?task.done:!task.done).filter(task=>task.title.toLowerCase().includes(q.toLowerCase()));
  const pendingCount=state.tasks.filter(task=>!task.done).length;
  return <PageShell title={t("Tareas")} subtitle={lang==="en"?`${pendingCount} pending in total`:`${pendingCount} pendientes en total`} action={<div className="flex gap-2"><Button variant="outline" className="h-11 px-3" onClick={()=>window.print()} title={lang==="en"?"Print / Save PDF":"Imprimir / Guardar PDF"}><Printer className="h-4 w-4"/><span className="hidden sm:inline">{lang==="en"?"Print / Save":"Imprimir / Guardar"}</span></Button><Button className="h-11" onClick={()=>{setEditing(null);setOpen(true)}}><Plus className="h-4 w-4"/> {t("Nueva")}</Button></div>}>
    <div className="print:hidden"><Input value={q} onChange={e=>setQ(e.target.value)} placeholder={t("Buscar tarea…")} className="h-12"/><div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1"><button onClick={()=>navigate({search:{}})} className={cn("shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold",!seccion&&"bg-primary text-primary-foreground")}>{t("Todas")}</button>{visibleSections.map(s=><button key={s.id} onClick={()=>navigate({search:{seccion:s.id}})} className={cn("shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold",seccion===s.id&&"bg-primary text-primary-foreground")}>{s.name}</button>)}</div><Tabs value={filter} onValueChange={v=>setFilter(v as typeof filter)} className="mt-3"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="pendientes">{t("Pendientes")}</TabsTrigger><TabsTrigger value="hechas">{t("Hechas")}</TabsTrigger><TabsTrigger value="todas">{t("Todas")}</TabsTrigger></TabsList></Tabs></div>
    {tasks.length===0?<p className="card-soft mt-4 p-4 text-sm text-muted-foreground">{t("No hay tareas para este filtro.")}</p>:<ul className="mt-4 space-y-2">{tasks.map(task=><TaskItem key={task.id} task={task} onEdit={item=>{setEditing(item);setOpen(true)}}/>)}</ul>}
    <TaskDialog open={open} onOpenChange={setOpen} task={editing} defaultSectionId={editing?undefined:(seccion??null)}/>
  </PageShell>;
}
