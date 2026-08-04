"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debtPaymentSchema, type DebtPaymentFormValues } from "@/lib/validations/debt";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";
import { centsToBRL } from "@/lib/formatters/currency";
import { toDateOnlyString } from "@/lib/formatters/date";

export interface DebtPaymentFormProps {
  currentBalanceCents: number;
  onSubmit: (values: DebtPaymentFormValues) => Promise<void>;
  onCancel: () => void;
}

export function DebtPaymentForm({ currentBalanceCents, onSubmit, onCancel }: DebtPaymentFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DebtPaymentFormValues>({
    resolver: zodResolver(debtPaymentSchema),
    defaultValues: {
      amountCents: 0,
      paymentDate: toDateOnlyString(new Date()),
      notes: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Saldo devedor atual: <span className="font-bold text-foreground">{centsToBRL(currentBalanceCents)}</span>
      </p>

      <div>
        <Label htmlFor="amountCents">Valor do pagamento</Label>
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
        <Label htmlFor="paymentDate">Data do pagamento</Label>
        <Controller
          control={control}
          name="paymentDate"
          render={({ field }) => <DateInput id="paymentDate" invalid={!!errors.paymentDate} {...field} />}
        />
        <FieldError message={errors.paymentDate?.message} />
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea id="notes" rows={3} {...register("notes")} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="secondary" loading={isSubmitting} disabled={isSubmitting}>
          Registrar pagamento
        </Button>
      </div>
    </form>
  );
}
