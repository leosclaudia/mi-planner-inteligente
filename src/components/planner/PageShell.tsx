import type { ReactNode } from "react";
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

  return (
    <div className="min-h-screen bg-background print:min-h-0 print:bg-white">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur print:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{t(title)}</h1>
            <div className="flex items-center gap-2">
              {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
              <SyncBadge className="shrink-0" />
            </div>
          </div>
          {action ? (
            <div className="shrink-0">{action}</div>
          ) : (
            <button
              type="button"
              onClick={() => window.print()}
              title={printLabel}
              aria-label={printLabel}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold shadow-sm"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">{lang === "en" ? "Print / Save" : "Imprimir / Guardar"}</span>
            </button>
          )}
        </div>
      </header>
      <main className="safe-bottom mx-auto max-w-3xl px-4 pt-4 print:max-w-none print:px-0 print:pt-0">{children}</main>
      <div className="print:hidden"><BottomNav /></div>
    </div>
  );
}
