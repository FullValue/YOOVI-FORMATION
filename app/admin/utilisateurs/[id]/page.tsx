import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, Eye } from "lucide-react";
import { isSuperAdmin, requireStaff } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { computeModuleProgress } from "@/lib/catalog";
import { getPlatformStats } from "@/lib/stats";
import { formatDate, formatRelative, formatTimecode } from "@/lib/format";
import { cn } from "@/lib/cn";
import { AdminHeader, Kpi, MiniBar, Panel, RoleBadge, StatusBadge } from "@/components/admin/ui";
import { EditUserButton, UserQuickActions } from "@/components/admin/UserActions";
import { ModuleCover } from "@/components/learning/ModuleCover";
import { EmptyState } from "@/components/ui/EmptyState";

type Params = { params: Promise<{ id: string }> };
export const metadata: Metadata = { title: "Utilisateur" };

export default async function UserDetail({ params }: Params) {
  const { id } = await params;
  const actor = await requireStaff();
  const repo = await getRepo();
  const user = await repo.getProfile(id);
  if (!user) notFound();
  const [s, rows, orgs] = await Promise.all([getPlatformStats(), repo.listProgress({ userId: id }), repo.listOrganizations()]);
  const org = orgs.find((o) => o.id === user.organization_id) ?? null;
  const l = s.learners.find((x) => x.profile.id === id);
  const map = new Map(rows.map((r) => [r.lesson_id, r]));
  const allowed = org?.catalog_mode === "custom" ? new Set(await repo.listOrganizationModuleIds(org.id)) : null;
  const mods = s.modules
    .filter((m) => m.status === "published" && (!allowed || allowed.has(m.id)))
    .map((m) => ({ ...m, lessons: m.lessons.filter((x) => x.status === "published") }))
    .filter((m) => m.lessons.length > 0);
  const superAdmin = isSuperAdmin(actor);
  const canEdit = user.role === "partner" || superAdmin || user.id === actor.id;

  return (
    <>
      <AdminHeader crumbs={[{ href: "/admin/utilisateurs", label: "Utilisateurs" }]} title={user.full_name || user.email}
        description={<span className="flex flex-wrap items-center gap-2">{user.email}{user.job_title ? ` · ${user.job_title}` : ""} <RoleBadge role={user.role} /> <StatusBadge status={user.status} /></span>}
        actions={canEdit && <>
          <EditUserButton user={user} organizations={orgs} canManageAdmins={superAdmin} isSelf={user.id === actor.id} />
          <UserQuickActions user={user} canEdit canDelete={superAdmin} isSelf={user.id === actor.id} />
        </>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Check />} label="Progression" value={`${l?.percent ?? 0} %`} hint={l ? `${l.completed}/${l.total} vidéos` : "Compte de l'équipe Yoovi"} tone="menthe" />
        <Kpi icon={<Eye />} label="Modules commencés" value={l?.modulesStarted ?? 0} hint={`${l?.modulesCompleted ?? 0} terminé(s)`} />
        <Kpi icon={<Clock />} label="Dernière activité" value={<span className="text-xl">{formatRelative(l?.lastActivity ?? user.last_seen_at)}</span>} tone="bleu" />
        <Kpi icon={<Check />} label="Organisme" value={<span className="text-xl">{org ? <Link href={`/admin/partenaires/${org.id}`} className="hover:text-violet-600">{org.name}</Link> : "Équipe Yoovi"}</span>} hint={`Compte créé le ${formatDate(user.created_at)}`} tone="jaune" />
      </div>

      <Panel className="mt-6" title="Progression individuelle" description="Détail par module et par vidéo.">
        {mods.length === 0 ? (
          <EmptyState compact title="Aucun module vidéo accessible" />
        ) : (
          <div className="space-y-4">
            {mods.map((m) => {
              const p = computeModuleProgress(m, map);
              return (
                <details key={m.id} className="group rounded-2xl border border-ligne" open={p.state === "in_progress"}>
                  <summary className="flex cursor-pointer list-none items-center gap-4 p-4 [&::-webkit-details-marker]:hidden">
                    <ModuleCover module={m} size="sm" className="size-11 shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1 font-semibold">{m.title}</span>
                    <MiniBar value={p.percent} className="w-40" />
                  </summary>
                  <ol className="border-t border-ligne px-4 py-2">
                    {m.lessons.map((ls, i) => {
                      const r = map.get(ls.id);
                      return (
                        <li key={ls.id} className="flex items-center gap-3 py-2 text-[14px]">
                          <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                            r?.status === "completed" ? "bg-menthe-100 text-menthe-700" : r ? "bg-violet-100 text-violet-700" : "bg-violet-50 text-ink-faint")}>
                            {r?.status === "completed" ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{ls.title}</span>
                          <span className="shrink-0 text-[12.5px] text-ink-faint">
                            {r?.status === "completed" ? `Terminée ${formatRelative(r.completed_at)}` : r ? `En cours · ${formatTimecode(r.last_position_seconds)} · ${r.view_count} vue(s)` : "Non commencée"}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </details>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}
