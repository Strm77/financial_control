"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";
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

const CARD_CATEGORY_NAMES = ["Cartão de Crédito", "Cartão de Loja"];

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
    watch,
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

  const description = watch("description");
  const categoryId = watch("categoryId");
  const selectedCategory = expenseCategories.find((c) => c.id === categoryId);
  const isCardCategory = !!selectedCategory && CARD_CATEGORY_NAMES.includes(selectedCategory.name);

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
          <Label htmlFor="amountCents">Valor real</Label>
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
          <Label htmlFor="dueDay">Data de vencimento</Label>
          <Controller
            control={control}
            name="dueDay"
            render={({ field }) => {
              const now = new Date();
              const day = field.value && field.value >= 1 && field.value <= 31 ? field.value : 1;
              const displayDate = toDateOnlyString(new Date(now.getFullYear(), now.getMonth(), day));
              return (
                <DateInput
                  id="dueDay"
                  invalid={!!errors.dueDay}
                  value={displayDate}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    field.onChange(Number(e.target.value.slice(8, 10)));
                  }}
                />
              );
            }}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">Só o dia é usado — vence nesse dia todo mês.</p>
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
          {isCardCategory ? (
            <>
              <Label>Cartão vinculado</Label>
              <div className="h-11 px-3 neu-rounded neu-surface bg-background-alt flex items-center gap-2 text-sm">
                <CreditCard className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{description?.trim() || "(preencha a descrição)"}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Um cartão com o mesmo nome da descrição é criado/vinculado automaticamente em Faturas.
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
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
