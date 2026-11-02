import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building, MapPin, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { getPlatformStats } from "@/lib/stats";
import { formatRelative } from "@/lib/format";
import { AdminHeader, MiniBar } from "@/components/admin/ui";
import { NewOrganizationButton } from "@/components/admin/OrganizationForm";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Partenaires" };

export default async function PartnersPage({ searchParams }: { searchParams: Promise<{ nouveau?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const s = await getPlatformStats();
  return (
    <>
      <AdminHeader title="Partenaires" description="Les organismes partenaires et leurs utilisateurs. Chaque partenaire ne voit que ses propres données."
        actions={<NewOrganizationButton defaultOpen={sp.nouveau === "1"} />} />
      {s.orgs.length === 0 ? (
        <EmptyState icon={<Building />} title="Aucun partenaire pour le moment">Créez un premier organisme pour inviter ses utilisateurs.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 stagger">
          {s.orgs.map((o) => (
            <Link key={o.organization.id} href={`/admin/partenaires/${o.organization.id}`}
              className="surface group flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-[#8059E3] font-display font-bold text-white">
                  {o.organization.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-bold">{o.organization.name}</h2>
                    {o.organization.status === "inactive" && <Badge tone="corail" dot>Désactivé</Badge>}
                    {o.organization.catalog_mode === "custom" && <Badge tone="bleu">Catalogue personnalisé</Badge>}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[13.5px] text-ink-muted">
                    {o.organization.kind}{o.organization.city && <><MapPin className="ml-1 size-3.5" />{o.organization.city}</>}
                  </p>
                </div>
                <ArrowRight className="size-5 text-ink-faint transition group-hover:translate-x-1 group-hover:text-violet-600" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-violet-50 p-3"><p className="font-display text-xl font-bold">{o.users}</p><p className="text-[12px] text-ink-muted">utilisateurs</p></div>
                <div className="rounded-2xl bg-violet-50 p-3"><p className="font-display text-xl font-bold">{o.learnersStarted}</p><p className="text-[12px] text-ink-muted">ont commencé</p></div>
                <div className="rounded-2xl bg-violet-50 p-3"><p className="font-display text-xl font-bold">{o.modulesCompleted}</p><p className="text-[12px] text-ink-muted">modules finis</p></div>
              </div>
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-[12.5px] text-ink-faint">
                  <span className="inline-flex items-center gap-1"><Users className="size-3.5" />Progression moyenne</span>
                  <span>{o.lastActivity ? `Actif ${formatRelative(o.lastActivity)}` : "Aucune activité"}</span>
                </div>
                <MiniBar value={o.avgPercent} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
