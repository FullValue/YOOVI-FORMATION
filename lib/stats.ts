import "server-only";
import { getRepo } from "@/lib/data";
import type { LessonProgress, ModuleWithContent, Organization, Profile } from "@/lib/types";

export interface LearnerStat {
  profile: Profile;
  organization: Organization | null;
  total: number;
  completed: number;
  percent: number;
  modulesCompleted: number;
  modulesStarted: number;
  lastActivity: string | null;
}

export interface OrgStat {
  organization: Organization;
  users: number;
  activeUsers: number;
  invited: number;
  avgPercent: number;
  learnersStarted: number;
  modulesCompleted: number;
  lastActivity: string | null;
}

export interface ModuleStat {
  module: ModuleWithContent;
  views: number;
  learners: number;
  completions: number;
  completionRate: number;
  lessons: { id: string; title: string; views: number; learners: number; completed: number }[];
}

export interface PlatformStats {
  modules: ModuleWithContent[];
  organizations: Organization[];
  profiles: Profile[];
  progress: LessonProgress[];
  learners: LearnerStat[];
  orgs: OrgStat[];
  moduleStats: ModuleStat[];
  totals: {
    organizationsActive: number;
    partnerUsers: number;
    activeUsers: number;
    invitedUsers: number;
    modulesPublished: number;
    lessonsPublished: number;
    lessonsWithVideo: number;
    avgPercent: number;
    completedLessons: number;
    activeLast30: number;
  };
}

const DAY = 864e5;
const isPublished = (m: ModuleWithContent) => m.status === "published";

/** Agrège toutes les données de suivi (back-office). Les règles de visibilité par organisme sont respectées. */
export async function getPlatformStats(filter?: { organizationId?: string }): Promise<PlatformStats> {
  const repo = await getRepo();
  const [modules, organizations, allProfiles, allProgress] = await Promise.all([
    repo.listModules(),
    repo.listOrganizations(),
    repo.listProfiles(filter?.organizationId ? { organizationId: filter.organizationId } : undefined),
    repo.listProgress(filter?.organizationId ? { organizationId: filter.organizationId } : {}),
  ]);

  const orgById = new Map(organizations.map((o) => [o.id, o]));
  const customModules = new Map<string, Set<string>>();
  await Promise.all(
    organizations.filter((o) => o.catalog_mode === "custom")
      .map(async (o) => customModules.set(o.id, new Set(await repo.listOrganizationModuleIds(o.id)))),
  );

  const published = modules.filter(isPublished).map((m) => ({ ...m, lessons: m.lessons.filter((l) => l.status === "published") }));
  const modulesFor = (orgId: string | null) => {
    const allowed = orgId ? customModules.get(orgId) : undefined;
    return published.filter((m) => !allowed || allowed.has(m.id));
  };

  const partners = allProfiles.filter((p) => p.role === "partner");
  const progressByUser = new Map<string, LessonProgress[]>();
  for (const row of allProgress) {
    const list = progressByUser.get(row.user_id) ?? [];
    list.push(row);
    progressByUser.set(row.user_id, list);
  }

  const learners: LearnerStat[] = partners.map((profile) => {
    const mods = modulesFor(profile.organization_id).filter((m) => m.lessons.length > 0);
    const rows = progressByUser.get(profile.id) ?? [];
    const byLesson = new Map(rows.map((r) => [r.lesson_id, r]));
    const total = mods.reduce((s, m) => s + m.lessons.length, 0);
    const completed = mods.reduce((s, m) => s + m.lessons.filter((l) => byLesson.get(l.id)?.status === "completed").length, 0);
    const lastActivity = rows.reduce<string | null>((a, r) => (!a || r.last_viewed_at > a ? r.last_viewed_at : a), null);
    return {
      profile,
      organization: profile.organization_id ? orgById.get(profile.organization_id) ?? null : null,
      total,
      completed,
      percent: total ? Math.round((completed / total) * 100) : 0,
      modulesCompleted: mods.filter((m) => m.lessons.every((l) => byLesson.get(l.id)?.status === "completed")).length,
      modulesStarted: mods.filter((m) => m.lessons.some((l) => byLesson.has(l.id))).length,
      lastActivity: lastActivity ?? profile.last_seen_at,
    };
  });

  const orgs: OrgStat[] = organizations
    .filter((o) => !filter?.organizationId || o.id === filter.organizationId)
    .map((organization) => {
      const ls = learners.filter((l) => l.profile.organization_id === organization.id);
      const enabled = ls.filter((l) => l.profile.status !== "disabled");
      return {
        organization,
        users: enabled.length,
        activeUsers: enabled.filter((l) => l.profile.status === "active").length,
        invited: enabled.filter((l) => l.profile.status === "invited").length,
        avgPercent: enabled.length ? Math.round(enabled.reduce((s, l) => s + l.percent, 0) / enabled.length) : 0,
        learnersStarted: enabled.filter((l) => l.modulesStarted > 0).length,
        modulesCompleted: enabled.reduce((s, l) => s + l.modulesCompleted, 0),
        lastActivity: enabled.reduce<string | null>((a, l) => (l.lastActivity && (!a || l.lastActivity > a) ? l.lastActivity : a), null),
      };
    });

  const partnerIds = new Set(partners.map((p) => p.id));
  const partnerProgress = allProgress.filter((r) => partnerIds.has(r.user_id));
  const moduleStats: ModuleStat[] = modules.map((module) => {
    const rows = partnerProgress.filter((r) => r.module_id === module.id);
    const learnersSet = new Set(rows.map((r) => r.user_id));
    const publishedLessons = module.lessons.filter((l) => l.status === "published");
    const completions = [...learnersSet].filter((u) =>
      publishedLessons.length > 0 && publishedLessons.every((l) => rows.some((r) => r.user_id === u && r.lesson_id === l.id && r.status === "completed")),
    ).length;
    return {
      module,
      views: rows.reduce((s, r) => s + r.view_count, 0),
      learners: learnersSet.size,
      completions,
      completionRate: learnersSet.size ? Math.round((completions / learnersSet.size) * 100) : 0,
      lessons: module.lessons.map((l) => {
        const lr = rows.filter((r) => r.lesson_id === l.id);
        return { id: l.id, title: l.title, views: lr.reduce((s, r) => s + r.view_count, 0), learners: lr.length, completed: lr.filter((r) => r.status === "completed").length };
      }),
    };
  });

  const enabledLearners = learners.filter((l) => l.profile.status !== "disabled");
  const since = Date.now() - 30 * DAY;
  return {
    modules, organizations, profiles: allProfiles, progress: allProgress, learners, orgs, moduleStats,
    totals: {
      organizationsActive: organizations.filter((o) => o.status === "active").length,
      partnerUsers: enabledLearners.length,
      activeUsers: enabledLearners.filter((l) => l.profile.status === "active").length,
      invitedUsers: enabledLearners.filter((l) => l.profile.status === "invited").length,
      modulesPublished: published.length,
      lessonsPublished: published.reduce((s, m) => s + m.lessons.length, 0),
      lessonsWithVideo: published.reduce((s, m) => s + m.lessons.filter((l) => l.video_ref).length, 0),
      avgPercent: enabledLearners.length ? Math.round(enabledLearners.reduce((s, l) => s + l.percent, 0) / enabledLearners.length) : 0,
      completedLessons: partnerProgress.filter((r) => r.status === "completed").length,
      activeLast30: enabledLearners.filter((l) => l.lastActivity && new Date(l.lastActivity).getTime() > since).length,
    },
  };
}
