import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Lang = "es" | "en";

type Dictionary = Record<string, string>;

const en: Dictionary = {
  "Inicio": "Home",
  "Agenda": "Planner",
  "Notas": "Notes",
  "Tareas": "Tasks",
  "Más": "More",
  "Mi cuenta y sincronización": "My account & sync",
  "Notas y lienzo libre": "Notes & free canvas",
  "Proyectos": "Projects",
  "Personalizar mi planner": "Customize my planner",
  "Configuración de ejemplo": "Sample setup",
  "Carga las secciones Proyectos, Huerta, Pedidos/Ventas y Contenido. Es opcional.": "Loads the Projects, Garden, Orders/Sales and Content sections. Optional.",
  "Aplicar preset de ejemplo": "Apply sample preset",
  "¿Reemplazar tus secciones?": "Replace your sections?",
  "Tus tareas y proyectos se conservan, pero las secciones actuales se reemplazan.": "Your tasks and projects are kept, but your current sections will be replaced.",
  "Cancelar": "Cancel",
  "Aplicar": "Apply",
  "Tus datos se guardan en este navegador y, si iniciás sesión, se sincronizan con tus otros dispositivos.": "Your data is saved in this browser and, when you sign in, it syncs with your other devices.",
  "Borrar todos mis datos": "Delete all my data",
  "¿Empezar de cero?": "Start over?",
  "Se borran secciones, tareas y proyectos de este navegador. No se puede deshacer.": "Sections, tasks and projects will be deleted from this browser. This cannot be undone.",
  "Borrar todo": "Delete everything",
  "Configuración de ejemplo aplicada": "Sample setup applied",
  "Calendario": "Calendar",
  "Asistente": "Assistant",
  "Cuenta": "Account",
  "Personalizar": "Customize",
  "Hoy": "Today",
  "Prioridades": "Priorities",
  "Recordatorios": "Reminders",
  "Lienzo libre": "Free canvas",
};

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (text: string) => string;
}>({ lang: "es", setLang: () => undefined, t: (text) => text });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("planner-language") : null;
    if (saved === "es" || saved === "en") return saved;
    if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) return "en";
    return "es";
  });

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem("planner-language", next);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t: (text: string) => (lang === "en" ? en[text] ?? text : text),
  }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
