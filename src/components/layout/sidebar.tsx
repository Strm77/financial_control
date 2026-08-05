"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-card neu-shadow-lg min-h-screen sticky top-0 z-10">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="size-10 neu-rounded neu-surface bg-primary text-primary-foreground grid place-items-center shrink-0">
          <Wallet className="size-5" aria-hidden="true" />
        </div>
        <span className="font-display font-bold text-lg leading-tight">Financeiro Pessoal</span>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1.5" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3.5 h-11 neu-rounded neu-surface font-semibold text-sm neu-press",
                active
                  ? "bg-primary text-primary-foreground neu-shadow-sm"
                  : "bg-transparent border-transparent shadow-none hover:bg-muted"
              )}
            >
              <Icon className="size-4.5 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
