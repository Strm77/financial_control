"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LogoutButton } from "@/components/layout/logout-button";

export function UserMenu({ displayName }: { displayName: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2.5 pl-1 pr-3 h-11 neu-rounded neu-surface bg-card neu-shadow-sm neu-press cursor-pointer"
      >
        <span className="size-8 shrink-0 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
          {initials}
        </span>
        <span className="hidden sm:inline text-sm font-semibold truncate max-w-32">{displayName}</span>
      </button>

      {open && (
        <div className="animate-fade-in-up absolute right-0 top-[calc(100%+8px)] z-30 w-60 p-2 neu-rounded neu-surface neu-shadow-lg bg-card flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <span className="text-sm font-semibold truncate">{displayName}</span>
            <ThemeToggle />
          </div>
          <div className="border-t border-border/60 pt-2 px-1">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
