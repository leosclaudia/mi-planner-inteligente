import type { ReactNode } from "react";
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
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{t(title)}</h1>
            <div className="flex items-center gap-2">
              {subtitle ? (
                <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
              <SyncBadge className="shrink-0" />
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </header>
      <main className="safe-bottom mx-auto max-w-3xl px-4 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
