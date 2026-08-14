import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { SectionChip } from "@/components/planner/SectionBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlanner, useSectionMap } from "@/lib/planner/store";
import type { Project } from "@/lib/planner/types";

export const Route = createFileRoute("/proyectos")({
  head: () => ({
    meta: [
      { title: "Proyectos | Planner Inteligente" },
      {
        name: "description",
        content: "Creá, editá y eliminá proyectos y seguí su avance con tareas asociadas.",
      },
      { property: "og:title", content: "Proyectos | Planner Inteligente" },
      {
        property: "og:description",
        content: "Organizá tus proyectos y su progreso real.",
      },
    ],
  }),
  component: () => (
    <AppGate>
      <ProyectosPage />
    </AppGate>
  ),
});

const NONE = "__none__";

function ProyectosPage() {
  const { state, addProject, updateProject, removeProject, visibleSections } = usePlanner();
  const sections = useSectionMap();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sectionId, setSectionId] = useState<string>(NONE);

  const openDialog = (p: Project | null) => {
    setEditing(p);
    setName(p?.name ?? "");
    setDescription(p?.description ?? "");
    setSectionId(p?.sectionId ?? NONE);
    setOpen(true);
  };

  const save = () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      description,
      sectionId: sectionId === NONE ? null : sectionId,
      color: "terra",
    };
    if (editing) updateProject(editing.id, data);
    else addProject(data);
    setOpen(false);
  };

  return (
    <PageShell
      title="Proyectos"
      subtitle={`${state.projects.length} en curso`}
      action={
        <Button className="h-11" onClick={() => openDialog(null)}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      }
    >
      {state.projects.length === 0 ? (
        <p className="card-soft p-4 text-sm text-muted-foreground">
          Todavía no tenés proyectos. Creá el primero para agrupar tus tareas.
        </p>
      ) : (
        <ul className="space-y-2">
          {state.projects.map((p) => {
            const tasks = state.tasks.filter((t) => t.projectId === p.id);
            const done = tasks.filter((t) => t.done).length;
            const section = p.sectionId ? sections[p.sectionId] : undefined;
            return (
              <li key={p.id} className="card-soft flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold">{p.name}</p>
                  {p.description ? (
                    <p className="mt-0.5 text-sm text-muted-foreground">{p.description}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {section ? (
                      <SectionChip name={section.name} color={section.color} />
                    ) : null}
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {done}/{tasks.length} tareas
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Editar proyecto"
                    onClick={() => openDialog(p)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Eliminar proyecto"
                    onClick={() => removeProject(p.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Nombre</Label>
              <Input
                id="p-name"
                className="h-12"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Lanzamiento de otoño"
              />
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
            <div className="space-y-2">
              <Label htmlFor="p-desc">Descripción</Label>
              <Textarea
                id="p-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" className="h-12" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button className="h-12" onClick={save} disabled={!name.trim()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
