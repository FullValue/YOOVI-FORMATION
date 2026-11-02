"use client";
import { useOptimistic, useTransition, type ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import type { ActionResult } from "@/lib/types";

/** Liste réordonnable par boutons (accessibles au clavier et au tactile), mise à jour optimiste. */
export function ReorderList<T extends { id: string }>({ items, onReorder, render, className }: {
  items: T[];
  onReorder: (ids: string[]) => Promise<ActionResult<unknown>>;
  render: (item: T, index: number, controls: ReactNode) => ReactNode;
  className?: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(items);
  const [, start] = useTransition();
  const toast = useToast();

  const move = (from: number, to: number) => {
    if (to < 0 || to >= optimistic.length) return;
    const next = [...optimistic];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    start(async () => {
      setOptimistic(next);
      const res = await onReorder(next.map((x) => x.id));
      if (!res.ok) toast("error", res.error);
    });
  };

  return (
    <ol className={className}>
      {optimistic.map((item, i) => (
        <li key={item.id} className="transition-all">
          {render(item, i, (
            <span className="flex shrink-0 flex-col">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Monter"
                className="grid size-7 place-items-center rounded-lg text-ink-faint hover:bg-violet-100 hover:text-violet-700 disabled:opacity-30">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === optimistic.length - 1} aria-label="Descendre"
                className="grid size-7 place-items-center rounded-lg text-ink-faint hover:bg-violet-100 hover:text-violet-700 disabled:opacity-30">
                <ArrowDown className="size-4" />
              </button>
            </span>
          ))}
        </li>
      ))}
    </ol>
  );
}
