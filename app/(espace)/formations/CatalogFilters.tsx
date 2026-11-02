"use client";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

const FILTERS = [
  { key: "all", label: "Tous" },
  { key: "in_progress", label: "En cours" },
  { key: "not_started", label: "À découvrir" },
  { key: "completed", label: "Terminés" },
] as const;

/** Filtre côté client : les cartes (rendues sur le serveur) portent data-state et data-search. */
export function CatalogFilters({ counts, children }: { counts: Record<string, number>; children: React.ReactNode }) {
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const css = useMemo(() => {
    const rules: string[] = [];
    if (filter !== "all") rules.push(`[data-catalog] > [data-state]:not([data-state="${filter}"]){display:none}`);
    const q = query.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/["\\]/g, "");
    if (q) rules.push(`[data-catalog] > [data-search]:not([data-search*="${q}"]){display:none}`);
    return rules.join("");
  }, [filter, query]);

  return (
    <>
      <style>{css}</style>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filtrer les modules">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}
              className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                filter === f.key ? "bg-ink text-white" : "bg-white text-ink-muted shadow-sm ring-1 ring-ligne hover:text-violet-700")}>
              {f.label}
              <span className={cn("rounded-full px-1.5 text-[11px]", filter === f.key ? "bg-white/20" : "bg-violet-100 text-violet-700")}>{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Rechercher un module ou une vidéo</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher…" className="field rounded-full py-2.5 pl-11 pr-10" />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-faint hover:bg-violet-100" aria-label="Effacer la recherche">
              <X className="size-4" />
            </button>
          )}
        </label>
      </div>
      {children}
    </>
  );
}
