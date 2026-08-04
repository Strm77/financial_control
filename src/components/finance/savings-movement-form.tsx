"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { savingsMovementSchema, type SavingsMovementFormValues } from "@/lib/validations/savings-goal";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";
import { toDateOnlyString } from "@/lib/formatters/date";

export interface SavingsMovementFormProps {
  onSubmit: (values: SavingsMovementFormValues) => Promise<void>;
  onCancel: () => void;
}

export function SavingsMovementForm({ onSubmit, onCancel }: SavingsMovementFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SavingsMovementFormValues>({
    resolver: zodResolver(savingsMovementSchema),
    defaultValues: {
      kind: "contribution",
      amountCents: 0,
      contributionDate: toDateOnlyString(new Date()),
      notes: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="kind">Tipo de movimentação</Label>
        <Select id="kind" {...register("kind")}>
          <option value="contribution">Contribuição (depósito)</option>
          <option value="withdrawal">Retirada</option>
        </Select>
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

      <div>
        <Label htmlFor="contributionDate">Data</Label>
        <Controller
          control={control}
          name="contributionDate"
          render={({ field }) => <DateInput id="contributionDate" invalid={!!errors.contributionDate} {...field} />}
        />
        <FieldError message={errors.contributionDate?.message} />
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
          Confirmar
        </Button>
      </div>
    </form>
  );
}
