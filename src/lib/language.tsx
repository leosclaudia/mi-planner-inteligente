import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Lang = "es" | "en";
type Dictionary = Record<string, string>;

const en: Dictionary = {
  "Inicio":"Home","Agenda":"Planner","Notas":"Notes","Tareas":"Tasks","Más":"More","Calendario":"Calendar","Asistente":"Assistant","Cuenta":"Account","Personalizar":"Customize","Proyectos":"Projects","Proyecto":"Project","Hoy":"Today","Prioridades":"Priorities","Recordatorios":"Reminders","Lienzo libre":"Free canvas",
  "HOY":"TODAY","PRIORIDADES":"PRIORITIES","RECORDATORIOS":"REMINDERS","LIENZO LIBRE":"FREE CANVAS",
  "Mi cuenta y sincronización":"My account & sync","Notas y lienzo libre":"Notes & free canvas","Personalizar mi planner":"Customize my planner","Idioma":"Language","Elegí el idioma de la aplicación.":"Choose the app language.",
  "Solo este equipo":"This device only","Sincronizando":"Syncing","Guardado":"Saved","Sin conexión":"Offline",
  "Configuración de ejemplo":"Sample setup","Carga las secciones Proyectos, Huerta, Pedidos/Ventas y Contenido. Es opcional.":"Loads the Projects, Garden, Orders/Sales and Content sections. Optional.","Aplicar preset de ejemplo":"Apply sample preset","¿Reemplazar tus secciones?":"Replace your sections?","Tus tareas y proyectos se conservan, pero las secciones actuales se reemplazan.":"Your tasks and projects are kept, but your current sections will be replaced.","Cancelar":"Cancel","Aplicar":"Apply","Tus datos se guardan en este navegador y, si iniciás sesión, se sincronizan con tus otros dispositivos.":"Your data is saved in this browser and, when you sign in, it syncs with your other devices.","Borrar todos mis datos":"Delete all my data","¿Empezar de cero?":"Start over?","Se borran secciones, tareas y proyectos de este navegador. No se puede deshacer.":"Sections, tasks and projects will be deleted from this browser. This cannot be undone.","Borrar todo":"Delete everything","Configuración de ejemplo aplicada":"Sample setup applied",
  "Un espacio simple para organizar, escribir y recordar.":"A simple space to organize, write and remember.","Día, semana y fechas importantes":"Day, week and important dates","Escribí, pegá imágenes, stickers o dibujá":"Write, paste images, stickers or draw","Sin pendientes":"No pending tasks","Lo dejamos disponible, pero fuera del camino principal para que el planner siga simple.":"It stays available without getting in the way, so your planner remains simple.","Abrir asistente":"Open assistant",
  "Tarea":"Task","Día":"Day","Semana":"Week","Mes":"Month","Anterior":"Previous","Siguiente":"Next","Ir a hoy":"Go to today","Sin tareas para este día.":"No tasks for this day.","Nueva":"New","Buscar tarea…":"Search task…","Todas":"All","Pendientes":"Pending","Hechas":"Done","No hay tareas para este filtro.":"No tasks match this filter.",
  "Editar tarea":"Edit task","Nueva tarea":"New task","¿Qué querés hacer?":"What do you want to do?","Ej: Regar plantines":"E.g. Water seedlings","Fecha":"Date","Prioridad":"Priority","Alta":"High","Media":"Medium","Baja":"Low","Sección":"Section","Sin sección":"No section","Sin proyecto":"No project","Detalles, links, recordatorios…":"Details, links, reminders…","Guardar cambios":"Save changes","Agregar tarea":"Add task","Marcar como pendiente":"Mark as pending","Completar tarea":"Complete task","Eliminar tarea":"Delete task",
  "Mi cuenta":"My account","Sincronización":"Sync","Sincronización activa":"Sync active","Sincronizando…":"Syncing…","Sin conexión (se guarda en este equipo)":"Offline (saved on this device)","Reintentando":"Retrying","Guardado en la nube":"Saved in the cloud","Sincronizar ahora":"Sync now","Cerrar sesión":"Sign out","Sincronizá entre dispositivos":"Sync across devices","Se sincronizan tareas, proyectos, agenda, secciones, onboarding y las notas del lienzo (texto con formato, dibujos manuscritos, stickers e imágenes).":"Tasks, projects, planner, sections, onboarding and canvas notes (formatted text, handwriting, stickers and images) are synced.","Con tu cuenta vas a ver el mismo planner en el celular, la tablet y la compu. Lo que ya tenés guardado en este navegador se sube automáticamente la primera vez.":"With your account you will see the same planner on your phone, tablet and computer. What is already saved in this browser is uploaded automatically the first time.","Contraseña":"Password","Mínimo 6 caracteres":"At least 6 characters","Un momento…":"One moment…","Iniciar sesión":"Sign in","Crear cuenta":"Create account","No tengo cuenta, quiero crear una":"I don't have an account, create one","Ya tengo cuenta":"I already have an account","Cuenta creada. Ya podés usar el planner sincronizado.":"Account created. Your planner can now sync.","Sesión iniciada. Sincronizando tus datos…":"Signed in. Syncing your data…","No se pudo completar":"Could not complete","Email o contraseña incorrectos":"Incorrect email or password","Ese email ya tiene cuenta. Iniciá sesión.":"That email already has an account. Sign in.",
  "Tocá una hoja y empezá. Las herramientas aparecen cuando las necesitás.":"Tap a page and start. Tools appear when you need them.","Tocá acá y escribí...":"Tap here and write...","Ideas, prioridades, listas...":"Ideas, priorities, lists...","Cosas para no olvidar...":"Things to remember...","Texto, imágenes, stickers...":"Text, images, stickers...","Negrita":"Bold","Cursiva":"Italic","Subrayar":"Underline","Fuente y tamaño":"Font and size","Imagen":"Image","Stickers":"Stickers","Color y resaltador":"Color & highlighter","Escribir a mano":"Handwrite","Elegir fuente":"Choose font","Ver fuentes instaladas en este dispositivo":"View fonts installed on this device","Buscar stickers":"Search stickers","Color del texto":"Text color","Todos los colores":"All colors","Resaltador":"Highlighter","Otro resaltado":"Another highlight","Texto normal":"Normal text","Quitar resaltado":"Remove highlight","Quitar formato":"Clear formatting","Manuscrito":"Handwriting","Goma":"Eraser","Fino":"Thin","Medio":"Medium","Grueso":"Thick","Muy grueso":"Extra thick","Color del lápiz":"Pen color","Borrar dibujo":"Clear drawing","Reconociendo escritura…":"Recognizing handwriting…","Convertir lo escrito a texto":"Convert handwriting to text","Este botón analiza lo que dibujaste y lo transforma en texto editable. La primera vez necesita conexión para cargar el reconocedor gratuito.":"This button analyzes what you drew and turns it into editable text. The first time it needs an internet connection to load the free recognizer.","Cortar caja":"Cut box","Copiar caja":"Copy box","Pegar":"Paste","Vaciar":"Clear","Editando:":"Editing:","Primero escribí algo a mano dentro de la caja.":"First write something by hand inside the box.","Reconociendo tu escritura… La primera vez puede tardar unos segundos.":"Recognizing your handwriting… The first time may take a few seconds.","No pude reconocer esa escritura. Probá con letras un poco más separadas y claras.":"I couldn't recognize that handwriting. Try clearer, more separated letters.","No se pudo cargar el reconocedor. Revisá la conexión y volvé a intentar.":"The recognizer could not load. Check your connection and try again.","Este navegador no permite listar las fuentes instaladas. Podés usar las fuentes compatibles de abajo.":"This browser cannot list installed fonts. You can use the compatible fonts below.","No se dio permiso para leer las fuentes del dispositivo.":"Permission to read device fonts was not granted.",
  "Favoritos":"Favorites","Deco":"Decor","Comida":"Food","Viajes":"Travel","Caritas":"Faces",
  "Nombre del planner":"Planner name","Tu nombre":"Your name","Opcional":"Optional","Empezar":"Start","Volver":"Back","Creemos tu planner":"Let's create your planner","Poné un nombre y contanos cómo te llamás. Podés cambiarlo cuando quieras.":"Give your planner a name and tell us your name. You can change it anytime.","Paso 1 de 2":"Step 1 of 2",
  "Trabajo":"Work","Estudio":"Study","Negocio":"Business","Huerta":"Garden","Bienestar":"Wellness","Contenido":"Content","Pedidos / Ventas":"Orders / Sales","Mi sección":"My section","Creá una sección totalmente propia":"Create a completely custom section",
  "Agregar":"Add","Editar":"Edit","Eliminar":"Delete","Guardar":"Save","Cerrar":"Close","Buscar":"Search","Nombre":"Name","Descripción":"Description","Color":"Color","Icono":"Icon","Crear sección":"Create section","Editar sección":"Edit section","Agregar sección":"Add section","Sin secciones":"No sections","Sin proyectos":"No projects","Nuevo proyecto":"New project","Nombre del proyecto":"Project name","Descripción opcional":"Optional description","Agregar proyecto":"Add project","Editar proyecto":"Edit project","Eliminar proyecto":"Delete project",
  "Page not found":"Page not found","Go home":"Go home","This page didn't load":"This page didn't load","Something went wrong on our end. You can try refreshing or head back home.":"Something went wrong on our end. You can try refreshing or head back home.","Try again":"Try again"
};

const reverse = Object.fromEntries(Object.entries(en).map(([es, english]) => [english, es]));

function translateDynamic(text: string, lang: Lang) {
  if (lang === "es") return reverse[text] ?? text;
  if (en[text]) return en[text];
  let m = text.match(/^(\d+) fuentes del dispositivo disponibles\.$/); if (m) return `${m[1]} device fonts available.`;
  m = text.match(/^Convertido a texto: “(.+)”$/); if (m) return `Converted to text: “${m[1]}”`;
  m = text.match(/^(\d+) pendientes en total$/); if (m) return `${m[1]} pending in total`;
  m = text.match(/^(\d+) pendientes$/); if (m) return `${m[1]} pending`;
  m = text.match(/^(\d+) tareas$/); if (m) return `${m[1]} tasks`;
  return text;
}

const LanguageContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void; t: (text: string) => string }>({ lang: "es", setLang: () => undefined, t: (text) => text });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("planner-language") : null;
    if (saved === "es" || saved === "en") return saved;
    if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("en")) return "en";
    return "es";
  });
  const setLang = (next: Lang) => { setLangState(next); localStorage.setItem("planner-language", next); };

  useEffect(() => {
    document.documentElement.lang = lang;
    const translateNode = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || parent.closest("[contenteditable='true'], textarea, input, script, style")) continue;
        const raw = node.textContent ?? "";
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const translated = translateDynamic(trimmed, lang);
        if (translated !== trimmed) node.textContent = raw.replace(trimmed, translated);
      }
      root.querySelectorAll?.("[placeholder],[title],[aria-label]").forEach((el) => {
        for (const attr of ["placeholder", "title", "aria-label"]) {
          const value = el.getAttribute(attr); if (!value) continue;
          const translated = translateDynamic(value, lang); if (translated !== value) el.setAttribute(attr, translated);
        }
      });
    };
    translateNode(document.body);
    const observer = new MutationObserver((mutations) => { for (const mutation of mutations) for (const node of Array.from(mutation.addedNodes)) if (node.nodeType === Node.ELEMENT_NODE) translateNode(node as Element); else if (node.parentElement) translateNode(node.parentElement); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t: (text: string) => translateDynamic(text, lang) }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
