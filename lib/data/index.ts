import "server-only";
import { cache } from "react";
import { assertBackendAllowed, isSupabaseConfigured } from "@/lib/env";
import type { Repo } from "./repo";

/** Accès aux données pour la requête en cours (un client Supabase lié aux cookies, ou la base démo). */
export const getRepo = cache(async (): Promise<Repo> => {
  assertBackendAllowed();
  if (isSupabaseConfigured) {
    const { createSupabaseRepo } = await import("./supabase/repo");
    return createSupabaseRepo();
  }
  const { createDemoRepo } = await import("./demo/repo");
  return createDemoRepo();
});
