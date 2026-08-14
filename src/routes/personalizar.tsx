import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppGate } from "@/components/planner/AppGate";
import { PageShell } from "@/components/planner/PageShell";
import { SectionIconBox } from "@/components/planner/SectionBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlanner } from "@/lib/planner/store";
import { ICON_KEYS, SECTION_COLORS, colorClasses, getIcon } from "@/lib/planner/icons";
import { SECTION_TEMPLATES, sectionFromTemplate } from "@/lib/planner/templates";
import type { Section } from "@/lib/planner/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/personalizar")({
  head: () => ({
    meta: [
      { title: "Personalizar mi planner | Planner Inteligente" },
      {
        name: "description",
        content:
          "Renombrá, ocultá, reordená y creá secciones para que el planner se parezca a tu vida.",
      },
      { property: "og:title", content: "Personalizar mi planner" },
      {
        property: "og:description",
        content: "Secciones, iconos y colores totalmente a tu medida.",
      },
    ],
  }),
  component: () => (
    <AppGate>
      <PersonalizarPage />
    </AppGate>
  ),
});

function PersonalizarPage() {
  const {
    state,
    setSettings,
    addSection,
    updateSection,
    removeSection,
    moveSection,
  } = usePlanner();
  const [editing, setEditing] = useState<Section | null>(null);
  const [creating, setCreating] = useState(false);

  const ordered = [...state.sections].sort((a, b) => a.order - b.order);

  return (
    <PageShell title="Personalizar" subtitle="Hacé que el planner sea tuyo">
      <section className="card-soft space-y-3 p-4">
        <div className="space-y-2">
          <Label htmlFor="pn">Nombre del planner</Label>
          <Input
            id="pn"
            className="h-12"
            value={state.settings.plannerName}
            onChange={(e) => setSettings({ plannerName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="on">Tu nombre</Label>
          <Input
            id="on"
            className="h-12"
            value={state.settings.ownerName}
            onChange={(e) => setSettings({ ownerName: e.target.value })}
          />
        </div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Mis secciones</h2>
          <Button className="h-10" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Nueva
          </Button>
        </div>
        <ul className="mt-3 space-y-2">
          {ordered.map((s, i) => (
            <li key={s.id} className="card-soft flex items-center gap-3 p-3">
              <SectionIconBox icon={s.icon} color={s.color} />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate font-semibold",
                  s.hidden && "text-muted-foreground line-through",
                )}
              >
                {s.name}
              </span>
              <div className="flex shrink-0 items-center">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Subir"
                  disabled={i === 0}
                  onClick={() => moveSection(s.id, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Bajar"
                  disabled={i === ordered.length - 1}
                  onClick={() => moveSection(s.id, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={s.hidden ? "Mostrar" : "Ocultar"}
                  onClick={() => updateSection(s.id, { hidden: !s.hidden })}
                >
                  {s.hidden ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Editar"
                  onClick={() => setEditing(s)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Eliminar"
                  onClick={() => {
                    removeSection(s.id);
                    toast("Sección eliminada");
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
          {ordered.length === 0 ? (
            <li className="card-soft p-4 text-sm text-muted-foreground">
              Todavía no tenés secciones. Creá una o usá una plantilla.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold">Plantillas de secciones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Agregalas con un toque y editalas después.
        </p>
        <div className="mt-3 grid gap-2">
          {SECTION_TEMPLATES.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                const s = sectionFromTemplate(t, state.sections.length);
                addSection({
                  name: s.name,
                  icon: s.icon,
                  color: s.color,
                  hidden: false,
                });
                toast.success(`“${t.name}” agregada`);
              }}
              className="card-soft flex items-center gap-3 p-3 text-left"
            >
              <SectionIconBox icon={t.icon} color={t.color} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t.description}
                </span>
              </span>
              <Plus className="h-5 w-5 shrink-0 text-primary" />
            </button>
          ))}
        </div>
      </section>

      <SectionDialog
        open={creating || !!editing}
        section={editing}
        onOpenChange={(v) => {
          if (!v) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSave={(data) => {
          if (editing) updateSection(editing.id, data);
          else addSection({ ...data, hidden: false });
        }}
      />
    </PageShell>
  );
}

function SectionDialog({
  open,
  section,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  section: Section | null;
  onOpenChange: (v: boolean) => void;
  onSave: (data: { name: string; icon: string; color: string }) => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("star");
  const [color, setColor] = useState<string>("terra");
  const [key, setKey] = useState("");

  const signature = `${open}-${section?.id ?? "new"}`;
  if (signature !== key) {
    setKey(signature);
    setName(section?.name ?? "");
    setIcon(section?.icon ?? "star");
    setColor(section?.color ?? "terra");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{section ? "Editar sección" : "Nueva sección"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="s-name">Nombre</Label>
            <Input
              id="s-name"
              className="h-12"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Casa"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {SECTION_COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-10 w-10 rounded-full",
                    colorClasses(c).dot,
                    color === c && "ring-2 ring-foreground ring-offset-2",
                  )}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Icono</Label>
            <div className="grid grid-cols-6 gap-2">
              {ICON_KEYS.map((k) => {
                const Icon = getIcon(k);
                return (
                  <button
                    key={k}
                    aria-label={`Icono ${k}`}
                    onClick={() => setIcon(k)}
                    className={cn(
                      "grid aspect-square place-items-center rounded-xl border border-border",
                      icon === k && "border-primary bg-terra-soft text-terra",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" className="h-12" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="h-12"
            disabled={!name.trim()}
            onClick={() => {
              onSave({ name: name.trim(), icon, color });
              onOpenChange(false);
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
