import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheckBig, Clock, TrendingUp, Users } from "lucide-react";
import { isSuperAdmin, requireStaff } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { getPlatformStats } from "@/lib/stats";
import { formatDate, formatRelative } from "@/lib/format";
import { AdminHeader, Kpi, MiniBar, Panel, StatusBadge } from "@/components/admin/ui";
import { EditOrganizationForm } from "@/components/admin/OrganizationForm";
import { CatalogAccessForm, DeleteOrganizationButton, NotesForm, OrganizationStatusButton } from "@/components/admin/OrganizationPanels";
import { InviteUserButton, UserQuickActions } from "@/components/admin/UserActions";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  return { title: (await (await getRepo()).getOrganization(id))?.name ?? "Partenaire" };
}

export default async function PartnerDetail({ params }: Params) {
  const { id } = await params;
  const actor = await requireStaff();
  const repo = await getRepo();
  const org = await repo.getOrganization(id);
  if (!org) notFound();
  const [s, notes, selected] = await Promise.all([getPlatformStats({ organizationId: id }), repo.getOrganizationNotes(id), repo.listOrganizationModuleIds(id)]);
  const o = s.orgs[0];
  const learners = s.learners.sort((a, b) => b.percent - a.percent);

  return (
    <>
      <AdminHeader crumbs={[{ href: "/admin/partenaires", label: "Partenaires" }]} title={org.name}
        description={<span className="flex flex-wrap items-center gap-2">
          {org.kind}{org.city ? ` · ${org.city}` : ""} · créé le {formatDate(org.created_at)}
          {org.status === "inactive" ? <Badge tone="corail" dot>Désactivé</Badge> : <Badge tone="menthe" dot>Actif</Badge>}
        </span>}
        actions={<OrganizationStatusButton org={org} />} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Users />} label="Utilisateurs" value={o?.users ?? 0} hint={`${o?.activeUsers ?? 0} actifs · ${o?.invited ?? 0} invités`} />
        <Kpi icon={<TrendingUp />} label="Progression moyenne" value={`${o?.avgPercent ?? 0} %`} tone="menthe" />
        <Kpi icon={<CircleCheckBig />} label="Modules terminés" value={o?.modulesCompleted ?? 0} hint="cumul des utilisateurs" tone="jaune" />
        <Kpi icon={<Clock />} label="Dernière activité" value={<span className="text-xl">{o?.lastActivity ? formatRelative(o.lastActivity) : "—"}</span>} tone="bleu" />
      </div>

      <Panel className="mt-6" title="Utilisateurs et progression" description="Seuls les utilisateurs de cet organisme sont listés."
        actions={<InviteUserButton organizations={[org]} fixedOrgId={org.id} canManageAdmins={false} size="sm" />}>
        {learners.length === 0 ? (
          <EmptyState compact icon={<Users />} title="Aucun utilisateur">Invitez les premiers utilisateurs de {org.name}.</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto sm:-mx-7">
            <table className="w-full min-w-[760px] text-left text-[14px]">
              <thead className="border-b border-ligne text-[12px] uppercase tracking-wide text-ink-faint">
                <tr><th className="px-5 py-3 font-semibold sm:px-7">Utilisateur</th><th className="px-3 py-3 font-semibold">Statut</th><th className="px-3 py-3 font-semibold">Progression</th><th className="px-3 py-3 font-semibold">Dernière activité</th><th className="px-5 py-3 sm:px-7"><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody className="divide-y divide-ligne">
                {learners.map((l) => (
                  <tr key={l.profile.id} className="align-middle">
                    <td className="px-5 py-3.5 sm:px-7">
                      <Link href={`/admin/utilisateurs/${l.profile.id}`} className="font-semibold hover:text-violet-600">{l.profile.full_name || l.profile.email}</Link>
                      <p className="text-[12.5px] text-ink-faint">{l.profile.full_name ? l.profile.email : l.profile.job_title}</p>
                    </td>
                    <td className="px-3 py-3.5"><StatusBadge status={l.profile.status} /></td>
                    <td className="w-48 px-3 py-3.5"><MiniBar value={l.percent} /><p className="mt-1 text-[12px] text-ink-faint">{l.completed}/{l.total} vidéos · {l.modulesCompleted} module(s)</p></td>
                    <td className="px-3 py-3.5 text-ink-muted">{l.lastActivity ? formatRelative(l.lastActivity) : "—"}</td>
                    <td className="px-5 py-3.5 sm:px-7"><div className="flex justify-end"><UserQuickActions user={l.profile} canEdit canDelete={isSuperAdmin(actor)} isSelf={l.profile.id === actor.id} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Informations"><EditOrganizationForm key={org.updated_at} org={org} /></Panel>
        <div className="space-y-6">
          <Panel title="Accès au catalogue" description="Par défaut, chaque partenaire accède à tous les modules publiés.">
            <CatalogAccessForm org={org} modules={s.modules.map((m) => ({ id: m.id, title: m.title, status: m.status }))} selected={selected} />
          </Panel>
          <Panel title="Suivi interne"><NotesForm orgId={org.id} notes={notes} /></Panel>
        </div>
      </div>

      {isSuperAdmin(actor) && (
        <Panel className="mt-6 border border-corail-100" title="Zone sensible" description="Suppression définitive de l'organisme (réservée aux super administrateurs).">
          <DeleteOrganizationButton org={org} />
        </Panel>
      )}
    </>
  );
}
