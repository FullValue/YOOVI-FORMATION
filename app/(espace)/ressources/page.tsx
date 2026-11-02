import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Library } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getVisibleCatalog } from "@/lib/catalog";
import { PageHeader } from "@/components/learning/PageHeader";
import { ModuleCover } from "@/components/learning/ModuleCover";
import { ResourceLink } from "@/components/learning/LessonPlayer";
import { EmptyState } from "@/components/ui/EmptyState";
import { SupportCard } from "@/components/learning/SupportCard";

export const metadata: Metadata = { title: "Ressources" };

export default async function ResourcesPage() {
  const user = await requireUser();
  const modules = (await getVisibleCatalog(user)).filter((m) => m.resources.length > 0);
  const total = modules.reduce((s, m) => s + m.resources.length, 0);
  return (
    <>
      <PageHeader eyebrow="Bibliothèque" title="Ressources et bonnes pratiques"
        description="Guides d'utilisation, tutoriels complémentaires et documents PDF, rassemblés au même endroit." />
      {total === 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <EmptyState icon={<Library />} title="La bibliothèque se remplit bientôt">
            L&apos;équipe Yoovi prépare des guides et des fiches pratiques. Ils apparaîtront ici dès leur publication.
          </EmptyState>
          <SupportCard />
        </div>
      ) : (
        <div className="space-y-10">
          {modules.map((m, i) => (
            <section key={m.id} aria-labelledby={`res-${m.id}`} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="mb-4 flex items-center gap-3">
                <ModuleCover module={m} size="sm" className="size-11 shrink-0 rounded-xl" />
                <h2 id={`res-${m.id}`} className="flex-1 text-xl font-bold">{m.title}</h2>
                <Link href={`/formations/${m.slug}`} className="hidden items-center gap-1 text-sm font-semibold text-violet-600 hover:underline sm:inline-flex">
                  Voir le module <ArrowRight className="size-4" />
                </Link>
              </div>
              <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{m.resources.map((r) => <ResourceLink key={r.id} r={r} />)}</ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
