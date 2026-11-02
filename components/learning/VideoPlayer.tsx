"use client";
import { useEffect, useRef } from "react";
import { Clapperboard } from "lucide-react";
import type { VideoProvider } from "@/lib/types";

/* Lecteur unifié : YouTube (non répertorié), Vimeo, fichier vidéo (MP4/WebM).
   Remonte la position de lecture et la fin de la vidéo pour la progression. */

export interface PlayerEvents {
  onTime?: (seconds: number, duration: number) => void;
  onPause?: (seconds: number) => void;
  onEnded?: (duration: number) => void;
}

type Props = PlayerEvents & { provider: VideoProvider; refId: string | null; startAt?: number; title: string };

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: { PLAYING: number; PAUSED: number; ENDED: number } };
    onYouTubeIframeAPIReady?: () => void;
    Vimeo?: { Player: new (el: HTMLElement, opts: unknown) => VimeoPlayer };
  }
}
interface YTPlayer { getCurrentTime(): number; getDuration(): number; destroy(): void }
interface VimeoPlayer {
  on(ev: string, cb: (d: { seconds: number; duration: number }) => void): void;
  setCurrentTime(s: number): Promise<number>;
  destroy(): Promise<void>;
}

const scripts = new Map<string, Promise<void>>();
function loadScript(src: string, ready?: () => boolean) {
  if (!scripts.has(src)) {
    scripts.set(src, new Promise<void>((resolve, reject) => {
      if (ready?.()) return resolve();
      const s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Lecteur indisponible"));
      document.head.appendChild(s);
    }));
  }
  return scripts.get(src)!;
}

function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(); };
    loadScript("https://www.youtube.com/iframe_api").catch(() => {});
  });
}

export function VideoPlayer({ provider, refId, startAt = 0, title, onTime, onPause, onEnded }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onTime, onPause, onEnded });
  handlers.current = { onTime, onPause, onEnded };

  useEffect(() => {
    if (!host.current || !refId) return;
    const mount = document.createElement("div");
    mount.className = "size-full";
    host.current.replaceChildren(mount);
    let disposed = false;
    let cleanup = () => {};

    if (provider === "youtube") {
      loadYouTube().then(() => {
        if (disposed || !window.YT) return;
        let timer: ReturnType<typeof setInterval> | undefined;
        const player = new window.YT.Player(mount, {
          videoId: refId,
          host: "https://www.youtube-nocookie.com",
          width: "100%", height: "100%",
          playerVars: { start: Math.floor(startAt), rel: 0, playsinline: 1, modestbranding: 1 },
          events: {
            onStateChange: (e: { data: number }) => {
              const S = window.YT!.PlayerState;
              clearInterval(timer);
              if (e.data === S.PLAYING) {
                timer = setInterval(() => handlers.current.onTime?.(player.getCurrentTime(), player.getDuration()), 1000);
              } else if (e.data === S.PAUSED) {
                handlers.current.onPause?.(player.getCurrentTime());
              } else if (e.data === S.ENDED) {
                handlers.current.onEnded?.(player.getDuration());
              }
            },
          },
        });
        cleanup = () => { clearInterval(timer); try { handlers.current.onPause?.(player.getCurrentTime()); player.destroy(); } catch {} };
      });
    } else if (provider === "vimeo") {
      loadScript("https://player.vimeo.com/api/player.js", () => Boolean(window.Vimeo)).then(() => {
        if (disposed || !window.Vimeo) return;
        const [id, hash] = refId.split(":");
        const player = new window.Vimeo.Player(mount, {
          url: hash ? `https://vimeo.com/${id}/${hash}` : `https://vimeo.com/${id}`,
          responsive: true, dnt: true, title: false, byline: false, portrait: false,
        });
        let last = 0;
        if (startAt > 0) player.setCurrentTime(startAt).catch(() => {});
        player.on("timeupdate", (d) => { last = d.seconds; handlers.current.onTime?.(d.seconds, d.duration); });
        player.on("pause", (d) => handlers.current.onPause?.(d.seconds));
        player.on("ended", (d) => handlers.current.onEnded?.(d.duration));
        cleanup = () => { handlers.current.onPause?.(last); player.destroy().catch(() => {}); };
      }).catch(() => {});
    }
    return () => { disposed = true; cleanup(); };
  }, [provider, refId, startAt]);

  if (!refId || provider === "none") {
    return (
      <div className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-[28px] bg-gradient-to-br from-violet-900 via-violet-800 to-[#2a1c6b] text-center text-white">
        <div className="absolute -left-10 -top-10 size-64 rounded-full bg-violet-500/40 blur-3xl" aria-hidden />
        <div className="absolute -bottom-16 -right-10 size-64 rounded-full bg-rose-500/30 blur-3xl" aria-hidden />
        <div className="relative px-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <Clapperboard className="size-7 text-rose-300" aria-hidden />
          </div>
          <p className="font-display text-xl font-bold text-white sm:text-2xl">Vidéo en préparation</p>
          <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-white/70">
            L&apos;équipe Yoovi finalise cette vidéo. Elle apparaîtra ici automatiquement dès sa mise en ligne.
          </p>
        </div>
      </div>
    );
  }

  if (provider === "file") {
    return (
      <video
        key={refId}
        className="aspect-video w-full rounded-[28px] bg-black"
        src={refId}
        controls
        playsInline
        preload="metadata"
        aria-label={title}
        onLoadedMetadata={(e) => { if (startAt > 0) e.currentTarget.currentTime = startAt; }}
        onTimeUpdate={(e) => handlers.current.onTime?.(e.currentTarget.currentTime, e.currentTarget.duration)}
        onPause={(e) => handlers.current.onPause?.(e.currentTarget.currentTime)}
        onEnded={(e) => handlers.current.onEnded?.(e.currentTarget.duration)}
      />
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-[28px] bg-black [&_iframe]:size-full" aria-label={title}>
      <div ref={host} className="size-full" />
    </div>
  );
}
