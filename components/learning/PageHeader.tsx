import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 pt-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:pt-8 animate-fade-up">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1.5 text-[30px] font-bold leading-tight sm:text-[40px]">{title}</h1>
        {description && <p className="mt-2 font-reading text-[16px] text-ink-muted sm:text-[17px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
