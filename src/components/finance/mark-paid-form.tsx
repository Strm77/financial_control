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
import { centsToBRL } from "@/lib/formatters/currency";

export interface MarkPaidFormProps {
  expectedAmountCents: number;
  defaultAmountCents: number;
  defaultHasDiscount?: boolean;
  onSubmit: (values: MarkPaymentPaidFormValues) => Promise<void>;
  onCancel: () => void;
}

export function MarkPaidForm({ expectedAmountCents, defaultAmountCents, defaultHasDiscount, onSubmit, onCancel }: MarkPaidFormProps) {
  const {
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MarkPaymentPaidFormValues>({
    resolver: zodResolver(markPaymentPaidSchema),
    defaultValues: {
      paidAt: toDateOnlyString(new Date()),
      amountPaidCents: defaultAmountCents,
      hasDiscount: defaultHasDiscount ?? false,
    },
  });

  const amountPaidCents = watch("amountPaidCents");
  const isBelowExpected = amountPaidCents < expectedAmountCents;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Valor real: <span className="font-bold text-foreground">{centsToBRL(expectedAmountCents)}</span>
      </p>

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

      {isBelowExpected && (
        <Controller
          control={control}
          name="hasDiscount"
          render={({ field }) => (
            <label className="flex items-start gap-3 neu-surface neu-rounded bg-background-alt p-3.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={field.value ?? false}
                onChange={(e) => field.onChange(e.target.checked)}
                className="mt-0.5 size-4 rounded neu-surface accent-primary cursor-pointer"
              />
              <span>
                <span className="block text-sm font-bold">Possui desconto?</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  O valor pago é menor que o valor real. Marque aqui se a diferença é um desconto (o pagamento conta como{" "}
                  <strong>Pago</strong>). Se deixar desmarcado, o status ficará como <strong>Pago Parcial</strong>.
                </span>
              </span>
            </label>
          )}
        />
      )}

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
