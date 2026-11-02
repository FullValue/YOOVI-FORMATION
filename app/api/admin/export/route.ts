import { NextResponse, type NextRequest } from "next/server";
import { accessState, getSessionUser, isStaff } from "@/lib/auth/session";
import { getPlatformStats } from "@/lib/stats";

/** Export CSV du suivi individuel (équipe Yoovi uniquement). */
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || accessState(user) !== "ok" || !isStaff(user)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const org = request.nextUrl.searchParams.get("partenaire") ?? undefined;
  const s = await getPlatformStats(org ? { organizationId: org } : undefined);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["Nom", "E-mail", "Organisme", "Statut", "Vidéos terminées", "Vidéos accessibles", "Progression (%)", "Modules terminés", "Dernière activité"];
  const lines = s.learners.map((l) => [
    l.profile.full_name, l.profile.email, l.organization?.name, l.profile.status, l.completed, l.total, l.percent, l.modulesCompleted, l.lastActivity ?? "",
  ].map(esc).join(";"));
  const csv = "﻿" + [header.map(esc).join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="suivi-formation-yoovi-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
