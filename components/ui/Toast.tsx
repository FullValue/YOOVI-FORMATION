"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ActionResult } from "@/lib/types";

type Toast = { id: number; tone: "success" | "error"; message: string };
const Ctx = createContext<(tone: Toast["tone"], message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast["tone"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, tone, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 6000 : 3800);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6">
        {toasts.map((t) => (
          <div key={t.id} role={t.tone === "error" ? "alert" : "status"}
            className={cn("pointer-events-auto flex w-full max-w-sm animate-scale-in items-start gap-3 rounded-2xl px-4 py-3 text-[14px] font-medium shadow-lift",
              t.tone === "success" ? "bg-ink text-white" : "bg-white text-corail-700 ring-1 ring-corail-100")}>
            {t.tone === "success" ? <CircleCheck className="mt-0.5 size-[18px] shrink-0 text-menthe-500" /> : <CircleAlert className="mt-0.5 size-[18px] shrink-0" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} className="opacity-60 hover:opacity-100" aria-label="Fermer">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

/** Affiche un toast à chaque nouveau résultat d'action serveur. */
export function useActionToast(state: ActionResult<unknown> | null, onSuccess?: () => void) {
  const toast = useToast();
  const last = useRef(state);
  useEffect(() => {
    if (!state || state === last.current) return;
    last.current = state;
    if (state.ok) {
      if (state.message) toast("success", state.message);
      onSuccess?.();
    } else if (!state.fieldErrors) {
      toast("error", state.error);
    }
  }, [state, toast, onSuccess]);
}
