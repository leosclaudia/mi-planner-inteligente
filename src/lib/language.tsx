import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Lang = "es" | "en";
type Dictionary = Record<string, string>;

const en: Dictionary = {
  "Inicio": "Home", "Agenda": "Planner", "Notas": "Notes", "Tareas": "Tasks", "Más": "More",
  "Mi cuenta y sincronización": "My account & sync", "Notas y lienzo libre": "Notes & free canvas", "Proyectos": "Projects", "Personalizar mi planner": "Customize my planner",
  "Configuración de ejemplo": "Sample setup", "Carga las secciones Proyectos, Huerta, Pedidos/Ventas y Contenido. Es opcional.": "Loads the Projects, Garden, Orders/Sales and Content sections. Optional.",
  "Aplicar preset de ejemplo": "Apply sample preset", "¿Reemplazar tus secciones?": "Replace your sections?", "Tus tareas y proyectos se conservan, pero las secciones actuales se reemplazan.": "Your tasks and projects are kept, but your current sections will be replaced.",
  "Cancelar": "Cancel", "Aplicar": "Apply", "Tus datos se guardan en este navegador y, si iniciás sesión, se sincronizan con tus otros dispositivos.": "Your data is saved in this browser and, when you sign in, it syncs with your other devices.",
  "Borrar todos mis datos": "Delete all my data", "¿Empezar de cero?": "Start over?", "Se borran secciones, tareas y proyectos de este navegador. No se puede deshacer.": "Sections, tasks and projects will be deleted from this browser. This cannot be undone.", "Borrar todo": "Delete everything", "Configuración de ejemplo aplicada": "Sample setup applied",
  "Calendario": "Calendar", "Asistente": "Assistant", "Cuenta": "Account", "Personalizar": "Customize", "Hoy": "Today", "Prioridades": "Priorities", "Recordatorios": "Reminders", "Lienzo libre": "Free canvas",
  "Un espacio simple para organizar, escribir y recordar.": "A simple space to organize, write and remember.", "Día, semana y fechas importantes": "Day, week and important dates", "Escribí, pegá imágenes, stickers o dibujá": "Write, paste images, stickers or draw", "Sin pendientes": "No pending tasks",
  "Lo dejamos disponible, pero fuera del camino principal para que el planner siga simple.": "It stays available without getting in the way, so your planner remains simple.", "Abrir asistente": "Open assistant",
  "Tarea": "Task", "Día": "Day", "Semana": "Week", "Mes": "Month", "Anterior": "Previous", "Siguiente": "Next", "Ir a hoy": "Go to today", "Sin tareas para este día.": "No tasks for this day.",
  "Nueva": "New", "Buscar tarea…": "Search task…", "Todas": "All", "Pendientes": "Pending", "Hechas": "Done", "No hay tareas para este filtro.": "No tasks match this filter.",
  "Editar tarea": "Edit task", "Nueva tarea": "New task", "¿Qué querés hacer?": "What do you want to do?", "Ej: Regar plantines": "E.g. Water seedlings", "Fecha": "Date", "Prioridad": "Priority", "Alta": "High", "Media": "Medium", "Baja": "Low", "Sección": "Section", "Sin sección": "No section", "Proyecto": "Project", "Sin proyecto": "No project", "Detalles, links, recordatorios…": "Details, links, reminders…", "Guardar cambios": "Save changes", "Agregar tarea": "Add task",
  "Marcar como pendiente": "Mark as pending", "Completar tarea": "Complete task", "Editar tarea": "Edit task", "Eliminar tarea": "Delete task",
  "Mi cuenta": "My account", "Sincronización": "Sync", "Sincronización activa": "Sync active", "Sincronizando…": "Syncing…", "Sin conexión (se guarda en este equipo)": "Offline (saved on this device)", "Reintentando": "Retrying", "Guardado en la nube": "Saved in the cloud", "Sincronizar ahora": "Sync now", "Cerrar sesión": "Sign out", "Sincronizá entre dispositivos": "Sync across devices",
  "Se sincronizan tareas, proyectos, agenda, secciones, onboarding y las notas del lienzo (texto con formato, dibujos manuscritos, stickers e imágenes).": "Tasks, projects, planner, sections, onboarding and canvas notes (formatted text, handwriting, stickers and images) are synced.",
  "Con tu cuenta vas a ver el mismo planner en el celular, la tablet y la compu. Lo que ya tenés guardado en este navegador se sube automáticamente la primera vez.": "With your account you will see the same planner on your phone, tablet and computer. What is already saved in this browser is uploaded automatically the first time.",
  "Contraseña": "Password", "Mínimo 6 caracteres": "At least 6 characters", "Un momento…": "One moment…", "Iniciar sesión": "Sign in", "Crear cuenta": "Create account", "No tengo cuenta, quiero crear una": "I don't have an account, create one", "Ya tengo cuenta": "I already have an account",
  "Cuenta creada. Ya podés usar el planner sincronizado.": "Account created. Your planner can now sync.", "Sesión iniciada. Sincronizando tus datos…": "Signed in. Syncing your data…", "No se pudo completar": "Could not complete", "Email o contraseña incorrectos": "Incorrect email or password", "Ese email ya tiene cuenta. Iniciá sesión.": "That email already has an account. Sign in.",
  "Idioma": "Language", "Elegí el idioma de la aplicación.": "Choose the app language."
};

const LanguageContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void; t: (text: string) => string }>({ lang: "es", setLang: () => undefined, t: (text) => text });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("planner-language") : null;
    if (saved === "es" || saved === "en") return saved;
    if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) return "en";
    return "es";
  });
  const setLang = (next: Lang) => { setLangState(next); localStorage.setItem("planner-language", next); };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t: (text: string) => (lang === "en" ? en[text] ?? text : text) }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
