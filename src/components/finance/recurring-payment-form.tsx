"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recurringPaymentSchema, type RecurringPaymentFormValues } from "@/lib/validations/recurring-payment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";
import { toDateOnlyString } from "@/lib/formatters/date";
import type { Category } from "@/types/entities";

export interface RecurringPaymentFormProps {
  expenseCategories: Category[];
  defaultValues?: Partial<RecurringPaymentFormValues>;
  onSubmit: (values: RecurringPaymentFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function RecurringPaymentForm({
  expenseCategories,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Salvar",
}: RecurringPaymentFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecurringPaymentFormValues>({
    resolver: zodResolver(recurringPaymentSchema),
    defaultValues: {
      description: defaultValues?.description ?? "",
      amountCents: defaultValues?.amountCents ?? 0,
      categoryId: defaultValues?.categoryId ?? null,
      dueDay: defaultValues?.dueDay ?? 1,
      startDate: defaultValues?.startDate ?? toDateOnlyString(new Date()),
      endDate: defaultValues?.endDate ?? null,
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" invalid={!!errors.description} placeholder="Ex: Aluguel" {...register("description")} />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <Label htmlFor="dueDay">Dia de vencimento</Label>
          <Input
            id="dueDay"
            type="number"
            min={1}
            max={31}
            invalid={!!errors.dueDay}
            {...register("dueDay", { valueAsNumber: true })}
          />
          <FieldError message={errors.dueDay?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="categoryId">Categoria</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select id="categoryId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)}>
              <option value="">Sem categoria</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Início</Label>
          <Controller
            control={control}
            name="startDate"
            render={({ field }) => <DateInput id="startDate" invalid={!!errors.startDate} {...field} />}
          />
          <FieldError message={errors.startDate?.message} />
        </div>
        <div>
          <Label htmlFor="endDate">Término (opcional)</Label>
          <Controller
            control={control}
            name="endDate"
            render={({ field }) => (
              <DateInput
                id="endDate"
                invalid={!!errors.endDate}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
              />
            )}
          />
          <FieldError message={errors.endDate?.message} />
        </div>
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
