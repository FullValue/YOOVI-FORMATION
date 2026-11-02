import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createUserClient } from "@/lib/data/supabase/clients";

/** Retour des liens Supabase (flux PKCE « ?code= ») : ouvre la session puis redirige. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safe(searchParams.get("next"));
  const code = searchParams.get("code");
  if (isSupabaseConfigured && code) {
    const sb = await createUserClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/reinitialiser?erreur=lien`);
}

function safe(v: string | null) {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/";
}
