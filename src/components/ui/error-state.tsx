import { AlertTriangle } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  description?: string;
}

export function ErrorState({
  title = "Algo deu errado",
  description = "Não foi possível carregar os dados. Tente novamente em instantes.",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3 neu-surface neu-rounded bg-danger/10"
    >
      <div className="size-14 neu-rounded neu-surface bg-danger text-danger-foreground flex items-center justify-center">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold font-display">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
