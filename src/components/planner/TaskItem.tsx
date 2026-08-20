import { ArrowDown, ArrowUp, Check, Pencil, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionChip } from "./SectionBadge";
import { usePlanner, useSectionMap } from "@/lib/planner/store";
import type { Task } from "@/lib/planner/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language";
import { CardBackgroundPicker, useCardBackground } from "./CardBackgroundPicker";

export function TaskItem({ task, onEdit }: { task: Task; onEdit: (t: Task) => void }) {
  const { toggleTask, removeTask, moveTask } = usePlanner();
  const sections = useSectionMap();
  const { t, lang } = useLanguage();
  const section = task.sectionId ? sections[task.sectionId] : undefined;
  const [cardBg] = useCardBackground(`task:${task.id}`);
  const priority = task.priority === "alta" ? t("Alta") : task.priority === "media" ? t("Media") : t("Baja");
  const dateLabel = task.date ? new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-AR", { day: "numeric", month: "short" }).format(new Date(`${task.date}T00:00:00`)) : null;
  const printOnly = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.stopPropagation();
    const card = event.currentTarget.closest("li"); if (!card) return;
    document.body.dataset.printMode = "single-item";
    document.body.dataset.printSection = lang === "en" ? "TASK" : "TAREA";
    card.setAttribute("data-print-selected", "true");
    window.print();
    window.setTimeout(() => { delete document.body.dataset.printMode; delete document.body.dataset.printSection; card.removeAttribute("data-print-selected"); }, 500);
  };
  return <li style={{backgroundColor:cardBg}} className="card-soft planner-print-item relative flex items-start gap-3 p-3">
    <CardBackgroundPicker storageKey={`task:${task.id}`} className="absolute right-2 top-2" />
    <button aria-label={t(task.done ? "Marcar como pendiente" : "Completar tarea")} onClick={() => toggleTask(task.id)} className={cn("mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-colors print:hidden", task.done ? "border-olive bg-olive text-primary-foreground" : "border-border text-transparent hover:border-primary")}><Check className="h-5 w-5" /></button>
    <div className="min-w-0 flex-1"><p className={cn("break-words font-semibold leading-snug", task.done && "text-muted-foreground line-through")}>{task.title}</p>{task.notes ? <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{task.notes}</p> : null}<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">{section ? <SectionChip name={section.name} color={section.color} /> : null}{dateLabel ? <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium">{dateLabel}</span> : null}<span className={cn("rounded-full px-2.5 py-0.5 font-medium", task.priority === "alta" ? "bg-terra-soft text-terra" : task.priority === "media" ? "bg-sun-soft text-sun" : "bg-muted")}>{priority}</span></div></div>
    <div className="flex shrink-0 flex-col gap-1 print:hidden"><Button size="icon" variant="ghost" aria-label={lang === "en" ? "Move task up" : "Subir tarea"} title={lang === "en" ? "Move up" : "Subir"} onClick={() => moveTask(task.id,-1)}><ArrowUp className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={lang === "en" ? "Move task down" : "Bajar tarea"} title={lang === "en" ? "Move down" : "Bajar"} onClick={() => moveTask(task.id,1)}><ArrowDown className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={lang === "en" ? "Print only this task" : "Imprimir solo esta tarea"} title={lang === "en" ? "Print only" : "Imprimir solo"} onClick={printOnly}><Printer className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={t("Editar tarea")} onClick={() => onEdit(task)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" aria-label={t("Eliminar tarea")} onClick={() => removeTask(task.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
  </li>;
}
