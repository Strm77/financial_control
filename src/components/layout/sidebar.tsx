"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 border-r-[3px] border-r-border bg-card min-h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-6 border-b-[3px] border-b-border">
        <div className="size-10 rounded-brutal border-brutal bg-primary text-primary-foreground grid place-items-center shrink-0">
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
                "flex items-center gap-3 px-3.5 h-11 rounded-brutal border-brutal font-semibold text-sm press-brutal",
                active
                  ? "bg-primary text-primary-foreground shadow-brutal-sm"
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
