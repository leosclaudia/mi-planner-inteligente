import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

// Paleta pastel compartida por todas las tarjetas.
// Para ampliar la paleta después, solamente hay que agregar colores a este array.
export const CARD_PASTEL_COLORS = [
  "#FFFFFF", // Blanco
  "#FCE8EC", // Rosa suave
  "#FDEAD7", // Durazno
  "#FFF4CC", // Crema
  "#EAF4E4", // Verde suave
  "#DFF3E8", // Menta
  "#E4F1F5", // Celeste
  "#E6ECFA", // Azul suave
  "#EEE8F6", // Lavanda
  "#F4E4F7", // Lila / rosa
  "#F4E8DE", // Beige
  "#F1EFEA", // Gris cálido
];

export function useCardBackground(key: string, fallback = "#FFFFFF") {
  const [color, setColorState] = useState(fallback);

  useEffect(() => {
    setColorState(localStorage.getItem(`planner-card-bg:${key}`) || fallback);
  }, [key, fallback]);

  const setColor = (value: string) => {
    setColorState(value);
    localStorage.setItem(`planner-card-bg:${key}`, value);
  };

  return [color, setColor] as const;
}

export function CardBackgroundPicker({
  storageKey,
  label = "Fondo",
  className = "",
}: {
  storageKey: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useCardBackground(storageKey);

  const choose = (value: string) => {
    setColor(value);
    setOpen(false);
  };

  return (
    <div
      className={`relative print:hidden ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-white/80 px-2.5 text-xs shadow-sm hover:bg-white"
      >
        <Palette className="h-3.5 w-3.5" />
        <span>{label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-card p-3 shadow-xl">
          <div className="mb-2 text-xs font-semibold">Colores pastel</div>

          <div className="grid grid-cols-6 gap-2">
            {CARD_PASTEL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c === "#FFFFFF" ? "Blanco" : c}
                aria-label={`Elegir fondo ${c}`}
                className={`h-8 w-8 rounded-lg border ${
                  color.toUpperCase() === c.toUpperCase()
                    ? "ring-2 ring-primary ring-offset-1"
                    : "border-border"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => choose(c)}
              />
            ))}
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Más colores…
              </span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                onBlur={() => setOpen(false)}
                className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
                aria-label="Elegir cualquier color de fondo"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
