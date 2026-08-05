import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "secondary" | "neutral";
  hint?: string;
}

const TONE_CLASSES = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  neutral: "bg-card text-card-foreground",
} as const;

export function MetricCard({ label, value, icon: Icon, tone = "neutral", hint }: MetricCardProps) {
  return (
    <div className={cn("neu-surface neu-rounded neu-shadow p-5 flex flex-col gap-2", TONE_CLASSES[tone])}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold uppercase tracking-wide opacity-80">{label}</span>
        {Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}
      </div>
      <span className="text-2xl sm:text-3xl font-bold font-display tabular-nums break-words">{value}</span>
      {hint && <span className="text-xs opacity-80">{hint}</span>}
    </div>
  );
}
