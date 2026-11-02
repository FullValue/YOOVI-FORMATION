import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getLearnerOverview } from "@/lib/catalog";
import { ModuleCard } from "@/components/learning/ModuleCard";
import { PageHeader } from "@/components/learning/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CatalogFilters } from "./CatalogFilters";

export const metadata: Metadata = { title: "Formations" };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default async function CatalogPage() {
  const user = await requireUser();
  const o = await getLearnerOverview(user);
  const counts = {
    all: o.modules.length,
    in_progress: o.counts.in_progress,
    not_started: o.counts.not_started,
    completed: o.counts.completed,
  };
  return (
    <>
      <PageHeader eyebrow="Catalogue des formations" title="Toutes vos formations"
        description="Des modules courts et progressifs pour découvrir Yoovi, le prendre en main et accompagner les élèves." />
      {o.modules.length === 0 ? (
        <EmptyState icon={<Sparkles />} title="Aucun module disponible pour le moment">
          L&apos;équipe Yoovi prépare vos formations. Vous serez prêt à démarrer dès leur publication.
        </EmptyState>
      ) : (
        <CatalogFilters counts={counts}>
          <div data-catalog className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger">
            {o.modules.map((p, i) => (
              <div key={p.module.id} data-state={p.state === "empty" ? "not_started" : p.state}
                data-search={norm([p.module.title, p.module.summary, ...p.module.lessons.map((l) => l.title)].join(" "))}>
                <ModuleCard p={p} index={i} />
              </div>
            ))}
          </div>
        </CatalogFilters>
      )}
    </>
  );
}
