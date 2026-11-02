const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

export const formatDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "—");
export const formatShortDate = (iso: string | null | undefined) => (iso ? shortFmt.format(new Date(iso)) : "—");

export function formatRelative(iso: string | null | undefined) {
  if (!iso) return "Jamais";
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return "à l'instant";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(iso);
}

/** 3725 → « 1 h 02 », 245 → « 4 min » */
export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return null;
  const m = Math.round(seconds / 60);
  if (m < 1) return "< 1 min";
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

/** 245 → « 4:05 » (position dans une vidéo) */
export function formatTimecode(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(mm).padStart(2, "0")}:${ss}` : `${mm}:${ss}`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;

export function initials(name: string | null | undefined, email: string) {
  const source = (name || email.split("@")[0]).trim();
  const parts = source.split(/[\s.\-_]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] ?? null;
}

export function slugify(input: string) {
  return input
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}
