import { NextResponse, type NextRequest } from "next/server";
import { accessState, getSessionUser, isStaff } from "@/lib/auth/session";
import { getVisibleCatalog } from "@/lib/catalog";
import { getRepo } from "@/lib/data";

/** Fichiers : miniatures (publiques en démo) et PDF privés, servis seulement si le module est accessible. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const [bucket, ...rest] = parts;
  const key = rest.join("/");
  if (!["thumbnails", "resources"].includes(bucket) || !key || key.includes("..")) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  const repo = await getRepo();
  if (bucket === "resources") {
    const user = await getSessionUser();
    if (!user || accessState(user) !== "ok") return NextResponse.redirect(new URL("/connexion", request.url));
    if (!isStaff(user)) {
      const catalog = await getVisibleCatalog(user);
      if (!catalog.some((m) => m.resources.some((r) => r.file_path === key))) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }
  }
  return repo.fileResponse(`${bucket}/${key}`, request.nextUrl.searchParams.has("telecharger"));
}
