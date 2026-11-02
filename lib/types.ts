export type UserRole = "super_admin" | "admin" | "partner";
export type AccountStatus = "invited" | "active" | "disabled";
export type PublishStatus = "draft" | "published";
export type VideoProvider = "none" | "youtube" | "vimeo" | "file";
export type ProgressStatus = "in_progress" | "completed";

export interface Organization {
  id: string;
  name: string;
  kind: string;
  city: string | null;
  contact_name: string | null;
  contact_email: string | null;
  status: "active" | "inactive";
  catalog_mode: "all" | "custom";
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  job_title: string | null;
  role: UserRole;
  organization_id: string | null;
  status: AccountStatus;
  last_seen_at: string | null;
  created_at: string;
}

export interface SessionUser extends Profile {
  organization: Organization | null;
}

export interface Module {
  id: string;
  slug: string;
  title: string;
  summary: string;
  objective: string;
  icon: string;
  color: string;
  thumbnail_url: string | null;
  position: number;
  status: PublishStatus;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string;
  video_provider: VideoProvider;
  video_ref: string | null;
  duration_seconds: number | null;
  position: number;
  status: PublishStatus;
  created_at: string;
}

export interface Resource {
  id: string;
  module_id: string;
  title: string;
  description: string;
  kind: "pdf" | "link";
  url: string | null;
  file_path: string | null;
  position: number;
  created_at: string;
}

export interface ModuleWithContent extends Module {
  lessons: Lesson[];
  resources: Resource[];
}

export interface LessonProgress {
  user_id: string;
  lesson_id: string;
  module_id: string;
  organization_id: string | null;
  status: ProgressStatus;
  last_position_seconds: number;
  view_count: number;
  first_viewed_at: string;
  last_viewed_at: string;
  completed_at: string | null;
}

/** Résultat standard des actions serveur (formulaires). */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  partner: "Partenaire",
};

export const STATUS_LABELS: Record<AccountStatus, string> = {
  invited: "Invitation envoyée",
  active: "Actif",
  disabled: "Désactivé",
};

export const ORG_KINDS = ["CCAS", "Collectivité", "Établissement scolaire", "Association", "Entreprise", "Autre"] as const;
