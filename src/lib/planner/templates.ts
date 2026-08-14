import type { Section } from "./types";

export interface SectionTemplate {
  key: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    key: "trabajo",
    name: "Trabajo",
    icon: "briefcase",
    color: "sky",
    description: "Reuniones, entregas y tareas laborales",
  },
  {
    key: "estudio",
    name: "Estudio",
    icon: "graduation",
    color: "plum",
    description: "Cursos, lecturas y exámenes",
  },
  {
    key: "negocio",
    name: "Negocio",
    icon: "store",
    color: "terra",
    description: "Ideas, finanzas y crecimiento",
  },
  {
    key: "huerta",
    name: "Huerta",
    icon: "sprout",
    color: "olive",
    description: "Siembra, riego y cosecha",
  },
  {
    key: "bienestar",
    name: "Bienestar",
    icon: "heart",
    color: "rose",
    description: "Hábitos, descanso y movimiento",
  },
  {
    key: "contenido",
    name: "Contenido",
    icon: "camera",
    color: "sun",
    description: "Ideas, grabación y publicaciones",
  },
  {
    key: "ventas",
    name: "Pedidos / Ventas",
    icon: "bag",
    color: "terra",
    description: "Pedidos, clientes y envíos",
  },
  {
    key: "personalizada",
    name: "Mi sección",
    icon: "sparkles",
    color: "plum",
    description: "Creá una sección totalmente propia",
  },
];

/** Configuración de ejemplo de la propietaria, separada del producto genérico. */
export const OWNER_PRESET_KEYS = ["negocio", "huerta", "ventas", "contenido"];

export function sectionFromTemplate(t: SectionTemplate, order: number): Section {
  return {
    id: crypto.randomUUID(),
    name: t.name,
    icon: t.icon,
    color: t.color,
    hidden: false,
    order,
  };
}
