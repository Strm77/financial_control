import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { CategoriesManager } from "@/components/finance/categories-manager";
import type { Category } from "@/types/entities";

export const metadata = { title: "Categorias — Financeiro Pessoal" };

export default async function CategoriasPage() {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Organize suas receitas e despesas por categoria, com ícone e cor."
      />

      {error ? (
        <ErrorState description="Não foi possível carregar suas categorias." />
      ) : (
        <CategoriesManager
          incomeCategories={(categories ?? []).filter((c: Category) => c.type === "income")}
          expenseCategories={(categories ?? []).filter((c: Category) => c.type === "expense")}
        />
      )}
    </div>
  );
}
