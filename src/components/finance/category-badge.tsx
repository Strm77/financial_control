import { getCategoryIcon } from "@/components/finance/category-icon";

export interface CategoryBadgeProps {
  name: string | null;
  color?: string | null;
  icon?: string | null;
}

export function CategoryBadge({ name, color, icon }: CategoryBadgeProps) {
  const Icon = getCategoryIcon(icon);
  const swatch = color ?? "#9ca3af";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 neu-rounded neu-surface text-xs font-bold bg-card"
      style={{ boxShadow: `inset 4px 0 0 0 ${swatch}` }}
    >
      {/* eslint-disable-next-line react-hooks/static-components -- Icon é selecionado de um mapa fixo de ícones (identidade estável), não criado dinamicamente */}
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {name ?? "Sem categoria"}
    </span>
  );
}
