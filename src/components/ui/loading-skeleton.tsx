import { cn } from "@/lib/utils";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={cn("rounded-brutal border-brutal bg-muted animate-skeleton", className)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border-brutal rounded-brutal bg-card p-5 shadow-brutal space-y-3">
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="h-8 w-32" />
      <LoadingSkeleton className="h-3 w-full" />
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <LoadingSkeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
