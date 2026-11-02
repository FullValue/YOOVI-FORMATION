import type {
  LessonProgress, Lesson, Module, ModuleWithContent, Organization, Profile, Resource, UserRole,
} from "@/lib/types";

export type AuthResult = { ok: true } | { ok: false; error: string };

export interface OrganizationInput {
  name: string;
  kind: string;
  city: string | null;
  contact_name: string | null;
  contact_email: string | null;
  status: "active" | "inactive";
  catalog_mode: "all" | "custom";
}

export interface InviteInput {
  email: string;
  full_name: string | null;
  job_title: string | null;
  role: UserRole;
  organization_id: string | null;
}

export type ModuleInput = Pick<Module, "title" | "slug" | "summary" | "objective" | "icon" | "color" | "thumbnail_url" | "status">;
export type LessonInput = Pick<Lesson, "title" | "description" | "video_provider" | "video_ref" | "duration_seconds" | "status">;
export type ResourceInput = Pick<Resource, "title" | "description" | "kind" | "url" | "file_path">;
export type ProgressEvent =
  | { type: "view" }
  | { type: "position"; seconds: number }
  | { type: "complete"; seconds?: number };

/**
 * Accès aux données. Deux implémentations : Supabase (production, RLS appliquée avec la session
 * de l'utilisateur) et démo (fichier local). Les contrôles de rôle sont faits en amont
 * (lib/auth/session.ts et actions serveur) : la RLS reste la garantie finale en production.
 */
export interface Repo {
  backend: "demo" | "supabase";

  // Authentification
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  currentUserId(): Promise<string | null>;
  requestPasswordReset(email: string): Promise<{ demoLink?: string }>;
  /** Démo : token du lien. Supabase : la session de récupération ouverte par /auth/callback. */
  canSetPassword(token: string | null): Promise<boolean>;
  setPassword(token: string | null, password: string): Promise<AuthResult>;
  /** Changement de mot de passe depuis le profil (vérifie l'ancien). */
  changePassword(userId: string, email: string, current: string, next: string): Promise<AuthResult>;

  // Lecture
  getProfile(id: string): Promise<Profile | null>;
  listProfiles(filter?: { organizationId?: string }): Promise<Profile[]>;
  getOrganization(id: string): Promise<Organization | null>;
  listOrganizations(): Promise<Organization[]>;
  getOrganizationNotes(id: string): Promise<string>;
  listOrganizationModuleIds(orgId: string): Promise<string[]>;
  listModules(): Promise<ModuleWithContent[]>;
  listProgress(filter: { userId?: string; organizationId?: string }): Promise<LessonProgress[]>;

  // Progression
  saveProgress(userId: string, lesson: Pick<Lesson, "id" | "module_id">, event: ProgressEvent): Promise<LessonProgress>;

  // Partenaires
  createOrganization(input: OrganizationInput): Promise<Organization>;
  updateOrganization(id: string, input: Partial<OrganizationInput>): Promise<void>;
  setOrganizationNotes(id: string, notes: string): Promise<void>;
  setOrganizationModules(orgId: string, moduleIds: string[]): Promise<void>;
  deleteOrganization(id: string): Promise<void>;

  // Utilisateurs (opérations Auth : serveur uniquement)
  inviteUser(input: InviteInput): Promise<{ id: string; demoLink?: string }>;
  updateProfile(id: string, patch: Partial<Pick<Profile, "full_name" | "job_title" | "role" | "organization_id" | "status">>): Promise<void>;
  sendAccessReset(email: string): Promise<{ demoLink?: string }>;
  deleteUser(id: string): Promise<void>;

  // Catalogue
  createModule(input: ModuleInput): Promise<Module>;
  updateModule(id: string, input: Partial<ModuleInput>): Promise<void>;
  deleteModule(id: string): Promise<void>;
  reorderModules(ids: string[]): Promise<void>;
  createLesson(moduleId: string, input: LessonInput): Promise<Lesson>;
  updateLesson(id: string, input: Partial<LessonInput>): Promise<void>;
  deleteLesson(id: string): Promise<void>;
  reorderLessons(moduleId: string, ids: string[]): Promise<void>;
  createResource(moduleId: string, input: ResourceInput): Promise<Resource>;
  updateResource(id: string, input: Partial<ResourceInput>): Promise<void>;
  deleteResource(id: string): Promise<void>;
  reorderResources(moduleId: string, ids: string[]): Promise<void>;

  // Fichiers
  uploadFile(bucket: "thumbnails" | "resources", file: File): Promise<string>;
  /** Réponse HTTP pour un fichier privé (flux en démo, redirection signée avec Supabase). */
  fileResponse(path: string, download: boolean): Promise<Response>;
}
