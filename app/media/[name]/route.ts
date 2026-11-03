import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { MEDIA_DIR } from "@/lib/media";
import { getSessionUser } from "@/lib/auth/session";

const TYPES: Record<string, string> = { ".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime" };

/** Lecture des vidéos importées, avec prise en charge des requêtes Range (avance rapide). */
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await getSessionUser())) return new Response("Non autorisé", { status: 401 });
  const { name } = await params;
  if (!/^[\w-]+\.(mp4|m4v|webm|mov)$/i.test(name)) return new Response("Introuvable", { status: 404 });
  const file = path.join(MEDIA_DIR, name);
  let size: number;
  try { size = statSync(file).size; } catch { return new Response("Introuvable", { status: 404 }); }
  const type = TYPES[path.extname(name).toLowerCase()] ?? "application/octet-stream";
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream, {
      status: 206,
      headers: { "Content-Type": type, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes" },
    });
  }
  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, {
    headers: { "Content-Type": type, "Content-Length": String(size), "Accept-Ranges": "bytes" },
  });
}
