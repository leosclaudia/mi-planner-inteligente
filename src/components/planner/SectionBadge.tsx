import { colorClasses, getIcon } from "@/lib/planner/icons";
import { cn } from "@/lib/utils";

export function SectionIconBox({
  icon,
  color,
  className,
}: {
  icon: string;
  color: string;
  className?: string;
}) {
  const Icon = getIcon(icon);
  const c = colorClasses(color);
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
        c.bg,
        c.text,
        className,
      )}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function SectionChip({ name, color }: { name: string; color: string }) {
  const c = colorClasses(color);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        c.bg,
        c.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {name}
    </span>
  );
}
