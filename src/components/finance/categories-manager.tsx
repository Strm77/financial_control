"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryForm } from "@/components/finance/category-form";
import { getCategoryIcon } from "@/components/finance/category-icon";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  seedDefaultCategoriesAction,
} from "@/lib/actions/categories";
import type { CategoryFormValues } from "@/lib/validations/category";
import type { Category } from "@/types/entities";

interface DialogState {
  mode: "create" | "edit";
  type: "income" | "expense";
  category?: Category;
}

export function CategoriesManager({
  incomeCategories,
  expenseCategories,
}: {
  incomeCategories: Category[];
  expenseCategories: Category[];
}) {
  const router = useRouter();
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const isFullyEmpty = incomeCategories.length === 0 && expenseCategories.length === 0;

  async function handleSeedDefaults() {
    setSeeding(true);
    const result = await seedDefaultCategoriesAction();
    setSeeding(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível criar as categorias padrão.");
      return;
    }
    toast.success("Categorias padrão criadas.");
    router.refresh();
  }

  async function handleSubmit(values: CategoryFormValues) {
    if (!dialogState) return;

    const result =
      dialogState.mode === "create"
        ? await createCategoryAction(values)
        : await updateCategoryAction(dialogState.category!.id, values);

    if (!result.success) {
      toast.error(result.message ?? "Não foi possível salvar a categoria.");
      return;
    }

    toast.success(dialogState.mode === "create" ? "Categoria criada." : "Categoria atualizada.");
    setDialogState(null);
    router.refresh();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteCategoryAction(deleteTarget.id);
    setDeleting(false);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível excluir a categoria.");
      return;
    }
    toast.success("Categoria excluída.");
    setDeleteTarget(null);
    router.refresh();
  }

  function renderList(type: "income" | "expense", categories: Category[]) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{type === "income" ? "Receitas" : "Despesas"}</CardTitle>
          <Button size="sm" variant={type === "income" ? "secondary" : "accent"} onClick={() => setDialogState({ mode: "create", type })}>
            <Plus className="size-4" aria-hidden="true" />
            Nova
          </Button>
        </CardHeader>

        {categories.length === 0 ? (
          <EmptyState
            title="Nenhuma categoria"
            description={`Crie categorias de ${type === "income" ? "receita" : "despesa"} para organizar seus lançamentos.`}
          />
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.icon);
              return (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 border-brutal rounded-brutal px-3 py-2.5 bg-background-alt"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="size-8 rounded-brutal border-brutal grid place-items-center shrink-0"
                      style={{ backgroundColor: category.color ?? "#9ca3af" }}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="font-semibold truncate">{category.name}</span>
                    {category.is_default && (
                      <span title="Categoria padrão">
                        <Star className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Editar ${category.name}`}
                      onClick={() => setDialogState({ mode: "edit", type, category })}
                      className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir ${category.name}`}
                      onClick={() => setDeleteTarget(category)}
                      className="size-9 grid place-items-center rounded-brutal border-brutal bg-card press-brutal cursor-pointer"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isFullyEmpty && (
        <Card className="bg-secondary text-secondary-foreground">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-bold font-display text-lg">Nenhuma categoria cadastrada ainda</p>
              <p className="text-sm opacity-90">Você pode começar com o conjunto padrão sugerido ou criar as suas.</p>
            </div>
            <Button variant="outline" loading={seeding} disabled={seeding} onClick={handleSeedDefaults}>
              Criar categorias padrão
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {renderList("expense", expenseCategories)}
        {renderList("income", incomeCategories)}
      </div>

      {dialogState && (
        <Dialog
          open
          onOpenChange={(open) => !open && setDialogState(null)}
          title={dialogState.mode === "create" ? "Nova categoria" : "Editar categoria"}
        >
          <CategoryForm
            defaultValues={
              dialogState.mode === "edit"
                ? {
                    name: dialogState.category?.name,
                    type: dialogState.category?.type,
                    icon: dialogState.category?.icon,
                    color: dialogState.category?.color,
                  }
                : { type: dialogState.type }
            }
            onSubmit={handleSubmit}
            onCancel={() => setDialogState(null)}
            submitLabel={dialogState.mode === "create" ? "Criar categoria" : "Salvar alterações"}
          />
        </Dialog>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir categoria"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Transações e cobranças vinculadas ficarão sem categoria.`}
        confirmLabel="Excluir"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
