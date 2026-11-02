import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { isSuperAdmin, requireStaff } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { getPlatformStats } from "@/lib/stats";
import { formatRelative } from "@/lib/format";
import { ROLE_LABELS, STATUS_LABELS, type Profile } from "@/lib/types";
import { AdminHeader, MiniBar, RoleBadge, StatusBadge } from "@/components/admin/ui";
import { EditUserButton, InviteUserButton, UserQuickActions } from "@/components/admin/UserActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Utilisateurs" };

type SP = { q?: string; partenaire?: string; role?: string; statut?: string; inviter?: string };

export default async function UsersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const actor = await requireStaff();
  const sp = await searchParams;
  const repo = await getRepo();
  const [profiles, s] = await Promise.all([repo.listProfiles(), getPlatformStats()]);
  const orgs = s.organizations;
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const learner = new Map(s.learners.map((l) => [l.profile.id, l]));
  const superAdmin = isSuperAdmin(actor);

  const q = (sp.q ?? "").trim().toLowerCase();
  const list = profiles.filter((p: Profile) =>
    (!q || `${p.email} ${p.full_name ?? ""} ${p.job_title ?? ""}`.toLowerCase().includes(q)) &&
    (!sp.partenaire || p.organization_id === sp.partenaire) &&
    (!sp.role || p.role === sp.role) &&
    (!sp.statut || p.status === sp.statut),
  );
  const filtered = Boolean(q || sp.partenaire || sp.role || sp.statut);

  return (
    <>
      <AdminHeader title="Utilisateurs" description={`${profiles.length} compte${profiles.length > 1 ? "s" : ""} au total, partenaires et équipe Yoovi.`}
        actions={<InviteUserButton organizations={orgs.map(({ id, name }) => ({ id, name }))} canManageAdmins={superAdmin} defaultOpen={sp.inviter === "1"} />} />

      <form className="surface mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto_auto]" role="search">
        <label className="relative">
          <span className="sr-only">Rechercher</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input name="q" defaultValue={sp.q} placeholder="Nom, e-mail, fonction…" className="field py-2.5 pl-11" />
        </label>
        <select name="partenaire" defaultValue={sp.partenaire ?? ""} className="field py-2.5" aria-label="Partenaire">
          <option value="">Tous les partenaires</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select name="role" defaultValue={sp.role ?? ""} className="field py-2.5" aria-label="Rôle">
          <option value="">Tous les rôles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="statut" defaultValue={sp.statut ?? ""} className="field py-2.5" aria-label="Statut">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex gap-2">
          <button className={buttonClass("dark", "md", "flex-1")}>Filtrer</button>
          {filtered && <Link href="/admin/utilisateurs" className={buttonClass("ghost", "md")}>Effacer</Link>}
        </div>
      </form>

      {list.length === 0 ? (
        <EmptyState icon={<Users />} title={filtered ? "Aucun résultat" : "Aucun utilisateur"}>
          {filtered ? "Modifiez ou effacez les filtres." : "Invitez un premier utilisateur partenaire."}
        </EmptyState>
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[14px]">
            <thead className="border-b border-ligne text-[12px] uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Utilisateur</th><th className="px-3 py-3.5 font-semibold">Organisme</th>
                <th className="px-3 py-3.5 font-semibold">Rôle · statut</th><th className="px-3 py-3.5 font-semibold">Progression</th>
                <th className="px-3 py-3.5 font-semibold">Activité</th><th className="px-6 py-3.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ligne">
              {list.map((p) => {
                const l = learner.get(p.id);
                const canEdit = p.role === "partner" || superAdmin || p.id === actor.id;
                return (
                  <tr key={p.id} className="align-middle transition hover:bg-violet-50/50">
                    <td className="px-6 py-3.5">
                      <Link href={`/admin/utilisateurs/${p.id}`} className="font-semibold hover:text-violet-600">{p.full_name || "—"}</Link>
                      <p className="text-[12.5px] text-ink-faint">{p.email}</p>
                    </td>
                    <td className="px-3 py-3.5">{p.organization_id ? <Link href={`/admin/partenaires/${p.organization_id}`} className="hover:text-violet-600">{orgName.get(p.organization_id) ?? "—"}</Link> : <span className="text-ink-faint">Équipe Yoovi</span>}</td>
                    <td className="px-3 py-3.5"><div className="flex flex-col items-start gap-1"><RoleBadge role={p.role} /><StatusBadge status={p.status} /></div></td>
                    <td className="w-44 px-3 py-3.5">{l ? <MiniBar value={l.percent} /> : <span className="text-ink-faint">—</span>}</td>
                    <td className="px-3 py-3.5 text-ink-muted">{formatRelative(l?.lastActivity ?? p.last_seen_at)}</td>
                    <td className="px-6 py-3.5">
                      {canEdit && (
                        <div className="flex items-center justify-end gap-1">
                          <EditUserButton user={p} organizations={orgs} canManageAdmins={superAdmin} isSelf={p.id === actor.id} />
                          <UserQuickActions user={p} canEdit canDelete={superAdmin} isSelf={p.id === actor.id} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
