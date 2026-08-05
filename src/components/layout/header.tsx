"use client";

import Link from "next/link";
import { MonthSelector } from "@/components/layout/month-selector";
import { UserMenu } from "@/components/layout/user-menu";
import { NavBar } from "@/components/layout/nav-bar";
import { useMonthParam } from "@/hooks/use-month-param";

export function Header({ displayName }: { displayName: string }) {
  const [period, setPeriod] = useMonthParam();

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-16">
        <Link href="/dashboard" className="text-lg font-bold font-display text-primary shrink-0">
          Dona Grana
        </Link>

        <div className="hidden sm:flex flex-1 items-center justify-center">
          <MonthSelector period={period} onChange={setPeriod} />
        </div>

        <UserMenu displayName={displayName} />
      </div>

      <div className="sm:hidden flex items-center justify-center pb-3">
        <MonthSelector period={period} onChange={setPeriod} />
      </div>

      <div className="border-t border-border/70" />
      <NavBar />
    </header>
  );
}
