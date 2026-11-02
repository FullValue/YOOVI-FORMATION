"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/** Fenêtre modale accessible basée sur <dialog> (focus piégé, Échap pour fermer). */
export function Dialog({ open, onClose, title, description, children, size = "md" }: {
  open: boolean; onClose: () => void; title: string; description?: ReactNode; children: ReactNode; size?: "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-[28px] bg-white p-0 text-ink shadow-lift backdrop:bg-ink/40 backdrop:backdrop-blur-sm open:animate-scale-in",
        size === "lg" ? "max-w-2xl" : "max-w-lg",
      )}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              {description && <p className="mt-1 text-[15px] text-ink-muted">{description}</p>}
            </div>
            <button onClick={onClose} className="-mr-2 -mt-1 grid size-10 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-violet-100" aria-label="Fermer">
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
