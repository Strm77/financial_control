"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, CATEGORY_ICONS, CATEGORY_COLORS, type CategoryFormValues } from "@/lib/validations/category";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { getCategoryIcon } from "@/components/finance/category-icon";
import { cn } from "@/lib/utils";

export interface CategoryFormProps {
  defaultValues?: Partial<CategoryFormValues>;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function CategoryForm({ defaultValues, onSubmit, onCancel, submitLabel = "Salvar" }: CategoryFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      type: defaultValues?.type ?? "expense",
      icon: defaultValues?.icon ?? CATEGORY_ICONS[0],
      color: defaultValues?.color ?? CATEGORY_COLORS[0],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" invalid={!!errors.name} placeholder="Ex: Streaming" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" invalid={!!errors.type} {...register("type")}>
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
        </Select>
        <FieldError message={errors.type?.message} />
      </div>

      <div>
        <Label>Cor</Label>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Escolha uma cor">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={field.value === color}
                  aria-label={`Cor ${color}`}
                  onClick={() => field.onChange(color)}
                  className={cn(
                    "size-9 neu-rounded neu-surface neu-press",
                    field.value === color && "ring-2 ring-offset-2 ring-foreground"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        />
      </div>

      <div>
        <Label>Ícone</Label>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2" role="radiogroup" aria-label="Escolha um ícone">
              {CATEGORY_ICONS.map((iconName) => {
                const Icon = getCategoryIcon(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    role="radio"
                    aria-checked={field.value === iconName}
                    aria-label={iconName}
                    onClick={() => field.onChange(iconName)}
                    className={cn(
                      "size-10 neu-rounded neu-surface bg-card grid place-items-center neu-press",
                      field.value === iconName && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="size-4.5" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
