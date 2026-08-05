"use client";

import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { MonthPicker } from "@/components/ui/month-picker";
import { LogoutButton } from "@/components/layout/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useMonthParam } from "@/hooks/use-month-param";
import { MONTH_AWARE_ROUTES } from "@/components/layout/nav-items";

export function Header({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const [period, setPeriod] = useMonthParam();
  const showMonthPicker = MONTH_AWARE_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur neu-shadow-sm">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-16">
        <div className="flex items-center gap-3 min-w-0">
          {showMonthPicker && <MonthPicker period={period} onChange={setPeriod} />}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 h-11 neu-rounded neu-surface bg-card neu-shadow-sm">
            <UserRound className="size-4" aria-hidden="true" />
            <span className="text-sm font-semibold truncate max-w-40">{displayName}</span>
          </div>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
