"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recurringPaymentSchema, PAYMENT_TYPE_LABELS, type RecurringPaymentFormValues } from "@/lib/validations/recurring-payment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";
import { toDateOnlyString } from "@/lib/formatters/date";
import type { Category, Card as CardEntity } from "@/types/entities";

export interface RecurringPaymentFormProps {
  expenseCategories: Category[];
  cards: CardEntity[];
  defaultValues?: Partial<RecurringPaymentFormValues>;
  onSubmit: (values: RecurringPaymentFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function RecurringPaymentForm({
  expenseCategories,
  cards,
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
      paymentType: defaultValues?.paymentType ?? "fixed",
      amountCents: defaultValues?.amountCents ?? 0,
      categoryId: defaultValues?.categoryId ?? null,
      cardId: defaultValues?.cardId ?? null,
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

      <div>
        <Label htmlFor="paymentType">Tipo</Label>
        <Select id="paymentType" invalid={!!errors.paymentType} {...register("paymentType")}>
          {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Fixa: mesmo valor todo mês, sem previsão de fim. Temporária: tem data de término. Variável: valor muda a cada mês.
        </p>
        <FieldError message={errors.paymentType?.message} />
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

      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <Label htmlFor="cardId">Cartão vinculado (opcional)</Label>
          <Controller
            control={control}
            name="cardId"
            render={({ field }) => (
              <Select id="cardId" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)}>
                <option value="">Nenhum</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">Se for a fatura de um cartão, vincule para gerenciar em Faturas.</p>
        </div>
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
