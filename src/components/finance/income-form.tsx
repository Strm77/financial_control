"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incomeSchema, type IncomeFormValues } from "@/lib/validations/income";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";
import { cn } from "@/lib/utils";

export interface IncomeFormProps {
  defaultValues?: Partial<IncomeFormValues>;
  onSubmit: (values: IncomeFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function IncomeForm({ defaultValues, onSubmit, onCancel, submitLabel = "Salvar" }: IncomeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      description: defaultValues?.description ?? "",
      type: defaultValues?.type ?? "fixed",
      amountCents: defaultValues?.amountCents ?? 0,
      referenceMonth: defaultValues?.referenceMonth ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" invalid={!!errors.description} placeholder="Ex: Salário CLT" {...register("description")} />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select id="type" invalid={!!errors.type} {...register("type")}>
            <option value="fixed">Renda fixa</option>
            <option value="variable">Renda variável</option>
          </Select>
          <FieldError message={errors.type?.message} />
        </div>
        <div>
          <Label htmlFor="amountCents">Valor</Label>
          <Controller
            control={control}
            name="amountCents"
            render={({ field }) => (
              <CurrencyInput id="amountCents" invalid={!!errors.amountCents} valueCents={field.value} onValueChange={field.onChange} />
            )}
          />
          <FieldError message={errors.amountCents?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="referenceMonth">Mês de referência</Label>
        <Controller
          control={control}
          name="referenceMonth"
          render={({ field }) => (
            <input
              id="referenceMonth"
              type="month"
              value={field.value ? field.value.slice(0, 7) : ""}
              onChange={(e) => field.onChange(e.target.value ? `${e.target.value}-01` : "")}
              className={cn(
                "w-full h-11 px-3 neu-rounded neu-surface bg-card text-card-foreground",
                errors.referenceMonth && "border-danger"
              )}
            />
          )}
        />
        <FieldError message={errors.referenceMonth?.message} />
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
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
