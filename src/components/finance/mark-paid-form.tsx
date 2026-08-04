"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { markPaymentPaidSchema, type MarkPaymentPaidFormValues } from "@/lib/validations/recurring-payment";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";
import { toDateOnlyString } from "@/lib/formatters/date";

export interface MarkPaidFormProps {
  defaultAmountCents: number;
  onSubmit: (values: MarkPaymentPaidFormValues) => Promise<void>;
  onCancel: () => void;
}

export function MarkPaidForm({ defaultAmountCents, onSubmit, onCancel }: MarkPaidFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MarkPaymentPaidFormValues>({
    resolver: zodResolver(markPaymentPaidSchema),
    defaultValues: {
      paidAt: toDateOnlyString(new Date()),
      amountPaidCents: defaultAmountCents,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="paidAt">Data do pagamento</Label>
        <Controller control={control} name="paidAt" render={({ field }) => <DateInput id="paidAt" invalid={!!errors.paidAt} {...field} />} />
        <FieldError message={errors.paidAt?.message} />
      </div>

      <div>
        <Label htmlFor="amountPaidCents">Valor pago</Label>
        <Controller
          control={control}
          name="amountPaidCents"
          render={({ field }) => (
            <CurrencyInput id="amountPaidCents" invalid={!!errors.amountPaidCents} valueCents={field.value} onValueChange={field.onChange} />
          )}
        />
        <FieldError message={errors.amountPaidCents?.message} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="secondary" loading={isSubmitting} disabled={isSubmitting}>
          Confirmar pagamento
        </Button>
      </div>
    </form>
  );
}
