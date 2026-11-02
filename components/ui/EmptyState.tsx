import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({ icon, title, children, action, className, compact }: {
  icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode; className?: string; compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-3xl border border-dashed border-violet-200 bg-white/60 text-center", compact ? "px-6 py-8" : "px-6 py-14", className)}>
      {icon && (
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-rose-100 text-violet-600 [&>svg]:size-6">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <div className="mt-1.5 max-w-md text-[15px] text-ink-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
