"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type TransactionFormValues } from "@/lib/validations/transaction";
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

export interface TransactionFormProps {
  categories: Category[];
  defaultValues?: Partial<TransactionFormValues>;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function TransactionForm({ categories, defaultValues, onSubmit, onCancel, submitLabel = "Salvar" }: TransactionFormProps) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: defaultValues?.description ?? "",
      amountCents: defaultValues?.amountCents ?? 0,
      type: defaultValues?.type ?? "expense",
      categoryId: defaultValues?.categoryId ?? null,
      transactionDate: defaultValues?.transactionDate ?? toDateOnlyString(new Date()),
      paymentMethod: defaultValues?.paymentMethod ?? null,
      notes: defaultValues?.notes ?? "",
    },
  });

  const selectedType = watch("type");
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === selectedType),
    [categories, selectedType]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" invalid={!!errors.description} placeholder="Ex: Mercado do mês" {...register("description")} />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select id="type" invalid={!!errors.type} {...register("type")}>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </Select>
          <FieldError message={errors.type?.message} />
        </div>
        <div>
          <Label htmlFor="amountCents">Valor</Label>
          <Controller
            control={control}
            name="amountCents"
            render={({ field }) => (
              <CurrencyInput
                id="amountCents"
                invalid={!!errors.amountCents}
                valueCents={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
          <FieldError message={errors.amountCents?.message} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="categoryId">Categoria</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                id="categoryId"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
              >
                <option value="">Sem categoria</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="transactionDate">Data</Label>
          <Controller
            control={control}
            name="transactionDate"
            render={({ field }) => (
              <DateInput id="transactionDate" invalid={!!errors.transactionDate} {...field} />
            )}
          />
          <FieldError message={errors.transactionDate?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="paymentMethod">Forma de pagamento</Label>
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field }) => (
            <Select id="paymentMethod" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)}>
              <option value="">Não informado</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </Select>
          )}
        />
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" invalid={!!errors.notes} rows={3} {...register("notes")} />
        <FieldError message={errors.notes?.message} />
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
