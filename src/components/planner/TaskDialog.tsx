import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlanner } from "@/lib/planner/store";
import type { Priority, Task } from "@/lib/planner/types";

const NONE = "__none__";

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultDate,
  defaultSectionId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  defaultDate?: string | null;
  defaultSectionId?: string | null;
}) {
  const { visibleSections, state, addTask, updateTask } = usePlanner();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [sectionId, setSectionId] = useState<string>(NONE);
  const [projectId, setProjectId] = useState<string>(NONE);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setNotes(task?.notes ?? "");
    setDate(task?.date ?? defaultDate ?? "");
    setPriority(task?.priority ?? "media");
    setSectionId(task?.sectionId ?? defaultSectionId ?? NONE);
    setProjectId(task?.projectId ?? NONE);
  }, [open, task, defaultDate, defaultSectionId]);

  const submit = () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      notes,
      date: date || null,
      priority,
      sectionId: sectionId === NONE ? null : sectionId,
      projectId: projectId === NONE ? null : projectId,
    };
    if (task) updateTask(task.id, payload);
    else addTask(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="t-title">¿Qué querés hacer?</Label>
            <Input
              id="t-title"
              value={title}
              autoFocus
              placeholder="Ej: Regar plantines"
              className="h-12"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-date">Fecha</Label>
            <Input
              id="t-date"
              type="date"
              className="h-12"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sección</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Sin sección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin sección</SelectItem>
                  {visibleSections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Proyecto</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Sin proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin proyecto</SelectItem>
                {state.projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-notes">Notas</Label>
            <Textarea
              id="t-notes"
              rows={3}
              value={notes}
              placeholder="Detalles, links, recordatorios…"
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="h-12" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="h-12" onClick={submit} disabled={!title.trim()}>
            {task ? "Guardar cambios" : "Agregar tarea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
