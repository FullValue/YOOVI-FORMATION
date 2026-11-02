import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheckBig, Download, Eye, Hourglass, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { getPlatformStats } from "@/lib/stats";
import { formatRelative } from "@/lib/format";
import { AdminHeader, Kpi, MiniBar, Panel, StatusBadge } from "@/components/admin/ui";
import { ModuleCover } from "@/components/learning/ModuleCover";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Statistiques" };

export default async function StatsPage({ searchParams }: { searchParams: Promise<{ partenaire?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const all = await getPlatformStats();
  const s = sp.partenaire ? await getPlatformStats({ organizationId: sp.partenaire }) : all;
  const t = s.totals;
  const mods = s.moduleStats.filter((m) => m.module.status === "published" && m.module.lessons.length > 0).sort((a, b) => b.views - a.views);
  const maxViews = Math.max(1, ...mods.map((m) => m.views));
  const learners = [...s.learners].filter((l) => l.profile.status !== "disabled").sort((a, b) => b.percent - a.percent);
  const done = learners.filter((l) => l.total > 0 && l.percent === 100).length;
  const inProgress = learners.filter((l) => l.modulesStarted > 0 && l.percent < 100).length;
  const lessons = s.moduleStats.flatMap((m) => m.lessons.map((l) => ({ ...l, module: m.module.title }))).sort((a, b) => b.views - a.views).slice(0, 8);
  const orgName = all.organizations.find((o) => o.id === sp.partenaire)?.name;

  return (
    <>
      <AdminHeader title="Statistiques et suivi" description={orgName ? `Données de ${orgName} uniquement.` : "Utilisation de la plateforme par l'ensemble des partenaires."}
        actions={<>
          <form className="flex gap-2">
            <select name="partenaire" defaultValue={sp.partenaire ?? ""} className="field py-2.5" aria-label="Filtrer par partenaire">
              <option value="">Tous les partenaires</option>
              {all.organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
            <button className={buttonClass("dark", "md")}>Afficher</button>
          </form>
          <a href={`/api/admin/export${sp.partenaire ? `?partenaire=${sp.partenaire}` : ""}`} className={buttonClass("secondary", "md")}><Download className="size-4" />Export CSV</a>
        </>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Users />} label="Apprenants" value={t.partnerUsers} hint={`${t.activeLast30} actif(s) sur 30 jours`} />
        <Kpi icon={<CircleCheckBig />} label="Parcours terminés" value={done} hint="100 % des vidéos accessibles" tone="menthe" />
        <Kpi icon={<Hourglass />} label="Formations en cours" value={inProgress} tone="jaune" />
        <Kpi icon={<Eye />} label="Vidéos terminées" value={t.completedLessons} hint={`Progression moyenne ${t.avgPercent} %`} tone="rose" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Consultation des modules" description="Vues, apprenants et taux de complétion.">
          {mods.length === 0 ? <EmptyState compact title="Aucun module vidéo publié" /> : (
            <ul className="space-y-5">
              {mods.map((m) => (
                <li key={m.module.id} className="flex items-center gap-3">
                  <ModuleCover module={m.module} size="sm" className="size-11 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2"><span className="truncate font-semibold">{m.module.title}</span><span className="shrink-0 text-[13px] tabular-nums text-ink-muted">{m.views} vues</span></div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-500" style={{ width: `${(m.views / maxViews) * 100}%` }} /></div>
                    <p className="mt-1 text-[12.5px] text-ink-faint">{m.learners} apprenant(s) · {m.completions} l&apos;ont terminé ({m.completionRate} %)</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Vidéos les plus vues">
          {lessons.every((l) => l.views === 0) ? <EmptyState compact icon={<Eye />} title="Pas encore de vues" /> : (
            <ol className="divide-y divide-ligne">
              {lessons.map((l, i) => (
                <li key={l.id} className="flex items-center gap-3 py-2.5 text-[14px]">
                  <span className="w-5 shrink-0 text-center font-display font-bold text-violet-500">{i + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{l.title}</span><span className="block truncate text-[12px] text-ink-faint">{l.module}</span></span>
                  <span className="shrink-0 text-right text-[12.5px] text-ink-muted">{l.views} vues<br />{l.completed} terminée(s)</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      {!sp.partenaire && (
        <Panel className="mt-6" title="Progression globale par partenaire">
          <div className="-mx-5 overflow-x-auto sm:-mx-7">
            <table className="w-full min-w-[640px] text-left text-[14px]">
              <thead className="border-b border-ligne text-[12px] uppercase tracking-wide text-ink-faint">
                <tr><th className="px-5 py-3 sm:px-7">Partenaire</th><th className="px-3 py-3">Utilisateurs</th><th className="px-3 py-3">Ont commencé</th><th className="px-3 py-3">Modules terminés</th><th className="px-5 py-3 sm:px-7">Progression moyenne</th></tr>
              </thead>
              <tbody className="divide-y divide-ligne">
                {s.orgs.map((o) => (
                  <tr key={o.organization.id}>
                    <td className="px-5 py-3 font-semibold sm:px-7"><Link href={`/admin/statistiques?partenaire=${o.organization.id}`} className="hover:text-violet-600">{o.organization.name}</Link></td>
                    <td className="px-3 py-3">{o.users}</td><td className="px-3 py-3">{o.learnersStarted}</td><td className="px-3 py-3">{o.modulesCompleted}</td>
                    <td className="w-56 px-5 py-3 sm:px-7"><MiniBar value={o.avgPercent} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Panel className="mt-6" title="Suivi individuel" description="Formations terminées et en cours, par utilisateur.">
        {learners.length === 0 ? <EmptyState compact icon={<Users />} title="Aucun utilisateur partenaire" /> : (
          <div className="-mx-5 overflow-x-auto sm:-mx-7">
            <table className="w-full min-w-[760px] text-left text-[14px]">
              <thead className="border-b border-ligne text-[12px] uppercase tracking-wide text-ink-faint">
                <tr><th className="px-5 py-3 sm:px-7">Utilisateur</th><th className="px-3 py-3">Organisme</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3">Modules</th><th className="px-3 py-3">Progression</th><th className="px-5 py-3 sm:px-7">Activité</th></tr>
              </thead>
              <tbody className="divide-y divide-ligne">
                {learners.map((l) => (
                  <tr key={l.profile.id}>
                    <td className="px-5 py-3 sm:px-7"><Link href={`/admin/utilisateurs/${l.profile.id}`} className="font-semibold hover:text-violet-600">{l.profile.full_name || l.profile.email}</Link></td>
                    <td className="px-3 py-3 text-ink-muted">{l.organization?.name ?? "—"}</td>
                    <td className="px-3 py-3"><StatusBadge status={l.profile.status} /></td>
                    <td className="px-3 py-3 text-ink-muted">{l.modulesCompleted} terminé(s) · {Math.max(0, l.modulesStarted - l.modulesCompleted)} en cours</td>
                    <td className="w-48 px-3 py-3"><MiniBar value={l.percent} /></td>
                    <td className="px-5 py-3 text-ink-muted sm:px-7">{formatRelative(l.lastActivity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
