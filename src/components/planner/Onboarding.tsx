import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SECTION_TEMPLATES, sectionFromTemplate } from "@/lib/planner/templates";
import { usePlanner } from "@/lib/planner/store";
import { SectionIconBox } from "./SectionBadge";
import { cn } from "@/lib/utils";

export function Onboarding() {
  const { state, replaceState } = usePlanner();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Mi Planner");
  const [owner, setOwner] = useState("");
  const [picked, setPicked] = useState<string[]>(["trabajo", "bienestar"]);

  const toggle = (key: string) =>
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const finish = () => {
    const sections = SECTION_TEMPLATES.filter((t) => picked.includes(t.key)).map((t, i) =>
      sectionFromTemplate(t, i),
    );
    replaceState({
      ...state,
      settings: {
        plannerName: name.trim() || "Mi Planner",
        ownerName: owner.trim(),
        onboarded: true,
      },
      sections,
    });
  };

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="gradient-warm grid h-11 w-11 place-items-center rounded-2xl text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-muted-foreground">
            Paso {step + 1} de 2
          </p>
        </div>

        {step === 0 ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Creemos tu planner</h1>
              <p className="mt-2 text-muted-foreground">
                Ponele un nombre y contanos cómo te llamás. Podés cambiarlo cuando quieras.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pname">Nombre del planner</Label>
              <Input
                id="pname"
                className="h-12"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mi Planner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oname">Tu nombre</Label>
              <Input
                id="oname"
                className="h-12"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <Button className="h-13 w-full py-4 text-base" onClick={() => setStep(1)}>
              Continuar
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Elegí tus secciones</h1>
              <p className="mt-2 text-muted-foreground">
                Son las áreas de tu vida que vas a organizar. Después podés renombrarlas,
                ocultarlas o crear nuevas.
              </p>
            </div>
            <div className="grid gap-3">
              {SECTION_TEMPLATES.map((t) => {
                const active = picked.includes(t.key);
                return (
                  <button
                    key={t.key}
                    onClick={() => toggle(t.key)}
                    className={cn(
                      "card-soft flex items-center gap-3 p-3 text-left transition-all",
                      active && "ring-2 ring-primary",
                    )}
                  >
                    <SectionIconBox icon={t.icon} color={t.color} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{t.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t.description}
                      </span>
                    </span>
                    {active ? <Check className="h-5 w-5 shrink-0 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-12 flex-1"
                onClick={() => setStep(0)}
              >
                Volver
              </Button>
              <Button className="h-12 flex-1" onClick={finish}>
                Empezar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
