"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const html = document.documentElement;
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    window.localStorage.setItem("theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema claro/escuro"
      className="relative size-11 shrink-0 neu-rounded neu-surface neu-shadow-sm neu-press text-foreground"
    >
      <Sun className="theme-icon-light absolute inset-0 m-auto size-4.5" aria-hidden="true" />
      <Moon className="theme-icon-dark absolute inset-0 m-auto size-4.5" aria-hidden="true" />
    </button>
  );
}
