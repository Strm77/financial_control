"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { savingsGoalSchema, type SavingsGoalFormValues } from "@/lib/validations/savings-goal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateInput } from "@/components/ui/date-input";

export interface SavingsGoalFormProps {
  defaultValues?: Partial<SavingsGoalFormValues>;
  onSubmit: (values: SavingsGoalFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function SavingsGoalForm({ defaultValues, onSubmit, onCancel, submitLabel = "Salvar" }: SavingsGoalFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SavingsGoalFormValues>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      targetAmountCents: defaultValues?.targetAmountCents ?? 0,
      targetDate: defaultValues?.targetDate ?? null,
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="name">Nome da meta</Label>
        <Input id="name" invalid={!!errors.name} placeholder="Ex: Reserva de emergência" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="targetAmountCents">Valor da meta</Label>
        <Controller
          control={control}
          name="targetAmountCents"
          render={({ field }) => (
            <CurrencyInput id="targetAmountCents" invalid={!!errors.targetAmountCents} valueCents={field.value} onValueChange={field.onChange} />
          )}
        />
        <FieldError message={errors.targetAmountCents?.message} />
      </div>

      <div>
        <Label htmlFor="targetDate">Prazo (opcional)</Label>
        <Controller
          control={control}
          name="targetDate"
          render={({ field }) => (
            <DateInput id="targetDate" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || null)} />
          )}
        />
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
