import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getRepo } from "@/lib/data";
import type { SessionUser } from "@/lib/types";

export type AccessState = "ok" | "disabled" | "org_inactive" | "no_org";

/** Utilisateur connecté (profil + organisme), ou null. Mis en cache pour la requête. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const repo = await getRepo();
  const id = await repo.currentUserId();
  if (!id) return null;
  const profile = await repo.getProfile(id);
  if (!profile) return null;
  const organization = profile.organization_id ? await repo.getOrganization(profile.organization_id) : null;
  return { ...profile, organization };
});

export function accessState(user: SessionUser): AccessState {
  if (user.status === "disabled") return "disabled";
  if (user.role === "partner") {
    if (!user.organization) return "no_org";
    if (user.organization.status !== "active") return "org_inactive";
  }
  return "ok";
}

export const isStaff = (user: Pick<SessionUser, "role"> | null) => user?.role === "admin" || user?.role === "super_admin";
export const isSuperAdmin = (user: Pick<SessionUser, "role"> | null) => user?.role === "super_admin";

/** Espace partenaire : tout compte actif (l'équipe Yoovi peut prévisualiser l'espace). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  const state = accessState(user);
  if (state !== "ok") redirect(`/acces-suspendu?raison=${state}`);
  return user;
}

export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isStaff(user)) redirect("/tableau-de-bord");
  return user;
}

/** Pour les actions serveur : lève une erreur au lieu de rediriger. */
export async function assertStaff(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || accessState(user) !== "ok" || !isStaff(user)) throw new Error("Action réservée à l'équipe Yoovi.");
  return user;
}

export async function assertUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || accessState(user) !== "ok") throw new Error("Session expirée. Reconnectez-vous.");
  return user;
}
