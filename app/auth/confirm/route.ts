import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createUserClient } from "@/lib/data/supabase/clients";

/** Liens des e-mails Supabase (invitation, récupération) au format « token_hash » : voir README. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? (type === "invite" ? "/reinitialiser?invitation=1" : "/reinitialiser");
  if (isSupabaseConfigured && tokenHash && type) {
    const sb = await createUserClient();
    const { error } = await sb.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error && next.startsWith("/") && !next.startsWith("//")) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/reinitialiser?erreur=lien`);
}
