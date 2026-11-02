import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building, CircleCheckBig, Clapperboard, Eye, MailQuestion, MonitorPlay, TrendingUp, UserPlus, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth/session";
import { getPlatformStats } from "@/lib/stats";
import { firstName, formatRelative } from "@/lib/format";
import { AdminHeader, Kpi, MiniBar, Panel } from "@/components/admin/ui";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModuleCover } from "@/components/learning/ModuleCover";

export const metadata: Metadata = { title: "Tableau de bord" };

export default async function AdminHome() {
  const user = await requireStaff();
  const s = await getPlatformStats();
  const t = s.totals;
  const missingVideos = t.lessonsPublished - t.lessonsWithVideo;
  const topModules = [...s.moduleStats].filter((m) => m.module.status === "published").sort((a, b) => b.views - a.views).slice(0, 5);
  const maxViews = Math.max(1, ...topModules.map((m) => m.views));
  const recent = [...s.progress].sort((a, b) => b.last_viewed_at.localeCompare(a.last_viewed_at)).slice(0, 6);
  const lessonById = new Map(s.modules.flatMap((m) => m.lessons.map((l) => [l.id, { l, m }] as const)));
  const profileById = new Map(s.profiles.map((p) => [p.id, p]));

  const todo = [
    missingVideos > 0 && { icon: <Clapperboard />, text: `${missingVideos} vidéo${missingVideos > 1 ? "s" : ""} publiée${missingVideos > 1 ? "s" : ""} sans lien vidéo`, href: "/admin/modules" },
    t.invitedUsers > 0 && { icon: <MailQuestion />, text: `${t.invitedUsers} invitation${t.invitedUsers > 1 ? "s" : ""} pas encore acceptée${t.invitedUsers > 1 ? "s" : ""}`, href: "/admin/utilisateurs?statut=invited" },
    s.orgs.some((o) => o.users === 0) && { icon: <UserPlus />, text: `${s.orgs.filter((o) => o.users === 0).length} partenaire(s) sans utilisateur`, href: "/admin/partenaires" },
  ].filter(Boolean) as { icon: React.ReactNode; text: string; href: string }[];

  return (
    <>
      <AdminHeader
        title={`Bonjour${firstName(user.full_name) ? ` ${firstName(user.full_name)}` : ""} 👋`}
        description="Vue d'ensemble de la plateforme de formation des partenaires Yoovi."
        actions={<>
          <Link href="/admin/utilisateurs?inviter=1" className={buttonClass("secondary", "md")}><UserPlus className="size-4" />Inviter</Link>
          <Link href="/admin/modules?nouveau=1" className={buttonClass("primary", "md")}><MonitorPlay className="size-4" />Nouveau module</Link>
        </>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 stagger">
        <Kpi icon={<Building />} label="Partenaires actifs" value={t.organizationsActive} hint={`${s.organizations.length} au total`} />
        <Kpi icon={<Users />} label="Utilisateurs partenaires" value={t.partnerUsers} hint={`${t.activeUsers} actifs · ${t.invitedUsers} invités`} tone="bleu" />
        <Kpi icon={<TrendingUp />} label="Progression moyenne" value={`${t.avgPercent} %`} hint={`${t.activeLast30} actif(s) sur 30 jours`} tone="menthe" />
        <Kpi icon={<MonitorPlay />} label="Modules publiés" value={t.modulesPublished} hint={`${t.lessonsWithVideo}/${t.lessonsPublished} vidéos en ligne`} tone="rose" />
      </div>

      {todo.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {todo.map((x) => (
            <Link key={x.text} href={x.href} className="group flex items-center gap-3 rounded-2xl border border-jaune-500/40 bg-jaune-100/60 p-4 text-[14px] font-semibold text-jaune-700 transition hover:bg-jaune-100">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-jaune-700 [&>svg]:size-[18px]">{x.icon}</span>
              <span className="flex-1">{x.text}</span>
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Panel title="Progression par partenaire" description="Moyenne de complétion des utilisateurs de chaque organisme."
          actions={<Link href="/admin/partenaires" className="text-sm font-semibold text-violet-600 hover:underline">Tous les partenaires</Link>}>
          {s.orgs.length === 0 ? (
            <EmptyState compact icon={<Building />} title="Aucun partenaire" action={<Link href="/admin/partenaires?nouveau=1" className={buttonClass("primary", "sm")}>Créer un partenaire</Link>} />
          ) : (
            <ul className="divide-y divide-ligne">
              {s.orgs.map((o) => (
                <li key={o.organization.id}>
                  <Link href={`/admin/partenaires/${o.organization.id}`} className="flex items-center gap-4 py-3.5 transition hover:opacity-80">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 font-display text-sm font-bold text-violet-700">
                      {o.organization.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{o.organization.name}</span>
                      <span className="block text-[12.5px] text-ink-faint">{o.users} utilisateur{o.users > 1 ? "s" : ""} · {o.lastActivity ? `actif ${formatRelative(o.lastActivity)}` : "aucune activité"}</span>
                    </span>
                    <MiniBar value={o.avgPercent} className="w-36 sm:w-44" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Modules les plus consultés" actions={<Link href="/admin/statistiques" className="text-sm font-semibold text-violet-600 hover:underline">Statistiques</Link>}>
          {topModules.every((m) => m.views === 0) ? (
            <EmptyState compact icon={<Eye />} title="Pas encore de consultation">Les vues apparaîtront dès que les partenaires commenceront leurs formations.</EmptyState>
          ) : (
            <ul className="space-y-4">
              {topModules.map((m) => (
                <li key={m.module.id} className="flex items-center gap-3">
                  <ModuleCover module={m.module} size="sm" className="size-10 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2 text-[14px]"><span className="truncate font-semibold">{m.module.title}</span><span className="shrink-0 tabular-nums text-ink-muted">{m.views} vue{m.views > 1 ? "s" : ""}</span></div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-violet-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-500" style={{ width: `${(m.views / maxViews) * 100}%` }} /></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Activité récente" className="mt-6">
        {recent.length === 0 ? (
          <EmptyState compact icon={<CircleCheckBig />} title="Aucune activité pour l'instant" />
        ) : (
          <ul className="divide-y divide-ligne">
            {recent.map((r) => {
              const x = lessonById.get(r.lesson_id);
              const p = profileById.get(r.user_id);
              return (
                <li key={`${r.user_id}-${r.lesson_id}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="min-w-0 flex-1 text-[14px]">
                    <Link href={`/admin/utilisateurs/${r.user_id}`} className="font-semibold hover:text-violet-600">{p?.full_name || p?.email || "Utilisateur"}</Link>
                    <span className="text-ink-muted"> {r.status === "completed" ? "a terminé" : "a consulté"} </span>
                    <span className="font-medium">« {x?.l.title ?? "vidéo supprimée"} »</span>
                  </span>
                  <span className="shrink-0 text-[12.5px] text-ink-faint">{x?.m.title} · {formatRelative(r.last_viewed_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
