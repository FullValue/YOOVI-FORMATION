import type { VideoProvider } from "@/lib/types";

/** Reconnaît un lien YouTube / Vimeo / fichier vidéo et renvoie la source normalisée. */
export function parseVideoInput(input: string): { provider: VideoProvider; ref: string | null } | null {
  const value = input.trim();
  if (!value) return { provider: "none", ref: null };

  const yt =
    value.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/) ??
    value.match(/^([A-Za-z0-9_-]{11})$/);
  if (yt) return { provider: "youtube", ref: yt[1] };

  // Vimeo, y compris les vidéos non répertoriées (hash privé : vimeo.com/123/abcd ou ?h=abcd)
  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([a-f0-9]+))?(?:.*[?&]h=([a-f0-9]+))?/);
  if (vimeo) {
    const hash = vimeo[2] ?? vimeo[3];
    return { provider: "vimeo", ref: hash ? `${vimeo[1]}:${hash}` : vimeo[1] };
  }

  if (/^(https:\/\/.+|\/[\w\-/.]+)\.(mp4|webm|m3u8)(\?.*)?$/i.test(value)) return { provider: "file", ref: value };
  return null;
}

/** Lien lisible pour réafficher la source dans le back-office. */
export function videoInputValue(provider: VideoProvider, ref: string | null) {
  if (!ref || provider === "none") return "";
  if (provider === "youtube") return `https://www.youtube.com/watch?v=${ref}`;
  if (provider === "vimeo") {
    const [id, hash] = ref.split(":");
    return hash ? `https://vimeo.com/${id}/${hash}` : `https://vimeo.com/${id}`;
  }
  return ref;
}

export const PROVIDER_LABELS: Record<VideoProvider, string> = {
  none: "Aucune vidéo",
  youtube: "YouTube",
  vimeo: "Vimeo",
  file: "Fichier vidéo",
};
