import { useEffect, type ReactNode } from "react";
import { Printer } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { SyncBadge } from "./SyncBadge";
import { useLanguage } from "@/lib/language";

export function PageShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { t, lang } = useLanguage();
  const printLabel = lang === "en" ? "Print / Save PDF" : "Imprimir / Guardar PDF";

  useEffect(() => {
    if (title !== "Notas") return;

    const labelMap: Record<string, string> = {
      HOY: lang === "en" ? "TODAY" : "HOY",
      PRIORIDADES: lang === "en" ? "PRIORITIES" : "PRIORIDADES",
      RECORDATORIOS: lang === "en" ? "REMINDERS" : "RECORDATORIOS",
      "LIENZO LIBRE": lang === "en" ? "FREE CANVAS" : "LIENZO LIBRE",
      TODAY: "TODAY",
      PRIORITIES: "PRIORITIES",
      REMINDERS: "REMINDERS",
      "FREE CANVAS": "FREE CANVAS",
    };

    const cards = Array.from(document.querySelectorAll<HTMLElement>("main section"));
    const cleanupFns: Array<() => void> = [];

    cards.forEach((card) => {
      const heading = card.firstElementChild as HTMLElement | null;
      if (!heading) return;
      const rawTitle = (heading.textContent || "").trim().toUpperCase();
      const matched = Object.keys(labelMap).find((key) => rawTitle.startsWith(key));
      if (!matched || card.dataset.printableNote === "true") return;

      card.dataset.printableNote = "true";
      card.dataset.noteTitle = labelMap[matched];
      card.classList.add("planner-print-card");
      heading.classList.add("planner-note-heading");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "planner-note-print-button";
      button.innerHTML = `<span aria-hidden="true">🖨️</span><span>${lang === "en" ? "Print only" : "Imprimir solo"}</span>`;
      button.setAttribute("aria-label", `${lang === "en" ? "Print only" : "Imprimir solo"} ${labelMap[matched]}`);

      const printOne = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        document.body.dataset.printMode = "single-note";
        document.body.dataset.printSection = labelMap[matched];
        card.dataset.printSelected = "true";
        window.setTimeout(() => window.print(), 30);
      };

      button.addEventListener("click", printOne);
      heading.appendChild(button);
      cleanupFns.push(() => {
        button.removeEventListener("click", printOne);
        button.remove();
        delete card.dataset.printableNote;
        delete card.dataset.noteTitle;
        card.classList.remove("planner-print-card");
        heading.classList.remove("planner-note-heading");
      });
    });

    const afterPrint = () => {
      delete document.body.dataset.printMode;
      delete document.body.dataset.printSection;
      document.querySelectorAll<HTMLElement>('[data-print-selected="true"]').forEach((el) => delete el.dataset.printSelected);
    };
    window.addEventListener("afterprint", afterPrint);

    return () => {
      cleanupFns.forEach((fn) => fn());
      window.removeEventListener("afterprint", afterPrint);
      afterPrint();
    };
  }, [title, lang]);

  const printAll = () => {
    delete document.body.dataset.printMode;
    delete document.body.dataset.printSection;
    document.querySelectorAll<HTMLElement>('[data-print-selected="true"]').forEach((el) => delete el.dataset.printSelected);
    window.print();
  };

  return (
    <div className="min-h-screen bg-background print:min-h-0 print:bg-white">
      <div className="planner-print-header" aria-hidden="true">
        <img src="/icon-192.png" alt="" />
        <div className="planner-print-brand">Mi Planner Inteligente</div>
        <div className="planner-print-subtitle">{lang === "en" ? "Your personal digital planner" : "Tu planner digital personal"}</div>
        <div className="planner-print-section">{t(title)}</div>
        <div className="planner-print-date">{new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</div>
      </div>
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur print:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{t(title)}</h1>
            <div className="flex items-center gap-2">
              {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
              <SyncBadge className="shrink-0" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={printAll} title={printLabel} aria-label={printLabel} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold shadow-sm">
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">{lang === "en" ? "Print / Save" : "Imprimir / Guardar"}</span>
            </button>
            {action ? <div>{action}</div> : null}
          </div>
        </div>
      </header>
      <main className="safe-bottom mx-auto max-w-3xl px-4 pt-4 print:max-w-none print:px-0 print:pt-0">{children}</main>
      <div className="print:hidden"><BottomNav /></div>
    </div>
  );
}
