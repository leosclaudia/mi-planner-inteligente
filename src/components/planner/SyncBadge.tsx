import { Link } from "@tanstack/react-router";
import { Check, CloudOff, LogIn, RefreshCw, TriangleAlert } from "lucide-react";
import { useSync } from "@/lib/planner/sync";
import { useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

/** Indicador discreto del estado de sincronización. */
export function SyncBadge({ className }: { className?: string }) {
  const { session, status, authReady } = useSync();
  const { t } = useLanguage();
  if (!authReady) return null;

  const base = cn(
    "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground",
    className,
  );

  if (!session) {
    return (
      <Link to="/cuenta" className={base}>
        <LogIn className="h-3.5 w-3.5" />
        {t("Solo este equipo")}
      </Link>
    );
  }

  const map = {
    syncing: { icon: RefreshCw, label: t("Sincronizando…"), spin: true, tone: "" },
    saved: { icon: Check, label: t("Guardado en la nube"), spin: false, tone: "text-olive" },
    offline: { icon: CloudOff, label: t("Sin conexión (se guarda en este equipo)"), spin: false, tone: "" },
    error: { icon: TriangleAlert, label: t("Reintentando"), spin: false, tone: "text-terra" },
    local: { icon: Check, label: t("Guardado"), spin: false, tone: "" },
  } as const;
  const { icon: Icon, label, spin, tone } = map[status];

  return (
    <Link to="/cuenta" className={cn(base, tone)}>
      <Icon className={cn("h-3.5 w-3.5", spin && "animate-spin")} />
      {label}
    </Link>
  );
}
