"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/layout/nav-items";

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="overflow-x-auto neu-scroll">
      <ul className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 min-w-max">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-active={active}
                style={{ "--glow": item.glow } as CSSProperties}
                className="nav-pill flex items-center gap-2 px-3.5 h-10 rounded-full text-sm font-semibold whitespace-nowrap"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
