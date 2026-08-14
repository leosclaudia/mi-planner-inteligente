import type { Priority, Section } from "./types";

export interface SuggestedTask {
  title: string;
  priority: Priority;
  sectionId: string | null;
  day: "hoy" | "manana" | "semana";
}

const URGENT = ["urgente", "hoy", "ya", "ahora", "importante", "vence", "entregar"];
const SOON = ["mañana", "manana", "pronto"];

/**
 * Organizador local (heurístico). La arquitectura está preparada para
 * reemplazar esta función por una llamada a IA real: misma entrada/salida.
 */
export async function organizeBrainDump(
  raw: string,
  sections: Section[],
): Promise<SuggestedTask[]> {
  const lines = raw
    .split(/\n|(?<=[.;])\s+|,\s+(?=[A-Za-zÁÉÍÓÚáéíóúñ])/)
    .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((l) => l.length > 2);

  return lines.map((line) => {
    const low = line.toLowerCase();
    const priority: Priority = URGENT.some((w) => low.includes(w))
      ? "alta"
      : SOON.some((w) => low.includes(w))
        ? "media"
        : "baja";
    const day: SuggestedTask["day"] = URGENT.some((w) => low.includes(w))
      ? "hoy"
      : SOON.some((w) => low.includes(w))
        ? "manana"
        : "semana";
    const match = sections.find(
      (s) => !s.hidden && low.includes(s.name.toLowerCase().split(" ")[0]),
    );
    return {
      title: line.charAt(0).toUpperCase() + line.slice(1),
      priority,
      sectionId: match?.id ?? null,
      day,
    };
  });
}
