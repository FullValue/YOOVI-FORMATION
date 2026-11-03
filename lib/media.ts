import "server-only";
import { randomUUID } from "node:crypto";
import { createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { DATA_DIR } from "@/lib/data/demo/store";

/** Vidéos importées depuis le back-office (mode local) : stockées hors de public/, servies par /media/[name]. */
export const MEDIA_DIR = path.join(DATA_DIR, "videos");

export async function saveUploadedVideo(file: File) {
  mkdirSync(MEDIA_DIR, { recursive: true });
  const ext = path.extname(file.name).toLowerCase() || ".mp4";
  const name = `${randomUUID()}${ext}`;
  await pipeline(Readable.fromWeb(file.stream() as never), createWriteStream(path.join(MEDIA_DIR, name)));
  return `/media/${name}`;
}
