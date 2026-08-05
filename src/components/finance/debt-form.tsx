"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debtSchema, type DebtFormValues } from "@/lib/validations/debt";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";

export interface DebtFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<DebtFormValues>;
  onSubmit: (values: DebtFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function DebtForm({ mode, defaultValues, onSubmit, onCancel, submitLabel = "Salvar" }: DebtFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      creditor: defaultValues?.creditor ?? "",
      originalAmountCents: defaultValues?.originalAmountCents ?? 0,
      currentBalanceCents: defaultValues?.currentBalanceCents ?? null,
      interestRate: defaultValues?.interestRate ?? null,
      minimumPaymentCents: defaultValues?.minimumPaymentCents ?? null,
      installmentAmountCents: defaultValues?.installmentAmountCents ?? null,
      totalInstallments: defaultValues?.totalInstallments ?? null,
      initialInstallmentsPaid: defaultValues?.initialInstallmentsPaid ?? null,
      dueDay: defaultValues?.dueDay ?? null,
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="name">Nome da dívida</Label>
        <Input id="name" invalid={!!errors.name} placeholder="Ex: Financiamento do carro" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="creditor">Credor (opcional)</Label>
        <Input id="creditor" placeholder="Ex: Banco XPTO" {...register("creditor")} />
      </div>

      <div>
        <Label htmlFor="originalAmountCents">Valor original</Label>
        <Controller
          control={control}
          name="originalAmountCents"
          render={({ field }) => (
            <CurrencyInput
              id="originalAmountCents"
              invalid={!!errors.originalAmountCents}
              valueCents={field.value}
              onValueChange={field.onChange}
              disabled={mode === "edit"}
            />
          )}
        />
        {mode === "edit" && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            O valor original não pode ser alterado. O saldo é atualizado ao registrar pagamentos.
          </p>
        )}
        <FieldError message={errors.originalAmountCents?.message} />
      </div>

      {mode === "create" && (
        <div className="border-brutal rounded-brutal bg-background-alt p-3.5 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground">
            Essa dívida já estava em andamento antes de você começar a controlar aqui? Preencha os campos abaixo. Se for uma dívida
            nova, pode deixar em branco.
          </p>
          <div>
            <Label htmlFor="currentBalanceCents">Saldo devedor atual (se diferente do valor original)</Label>
            <Controller
              control={control}
              name="currentBalanceCents"
              render={({ field }) => (
                <CurrencyInput
                  id="currentBalanceCents"
                  invalid={!!errors.currentBalanceCents}
                  valueCents={field.value ?? null}
                  onValueChange={(cents) => field.onChange(cents || null)}
                />
              )}
            />
            <FieldError message={errors.currentBalanceCents?.message} />
          </div>
          <div>
            <Label htmlFor="initialInstallmentsPaid">Parcelas já pagas antes de cadastrar</Label>
            <Input
              id="initialInstallmentsPaid"
              type="number"
              min={0}
              invalid={!!errors.initialInstallmentsPaid}
              {...register("initialInstallmentsPaid", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Usado junto com o número total de parcelas para calcular a parcela atual corretamente.
            </p>
            <FieldError message={errors.initialInstallmentsPaid?.message} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="interestRate">Taxa de juros % (informativa)</Label>
          <Input
            id="interestRate"
            type="number"
            step="0.01"
            min={0}
            {...register("interestRate", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
          />
          <FieldError message={errors.interestRate?.message} />
        </div>
        <div>
          <Label htmlFor="minimumPaymentCents">Pagamento mínimo</Label>
          <Controller
            control={control}
            name="minimumPaymentCents"
            render={({ field }) => (
              <CurrencyInput
                id="minimumPaymentCents"
                valueCents={field.value ?? null}
                onValueChange={(cents) => field.onChange(cents || null)}
              />
            )}
          />
          <FieldError message={errors.minimumPaymentCents?.message} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="installmentAmountCents">Valor da parcela (opcional)</Label>
          <Controller
            control={control}
            name="installmentAmountCents"
            render={({ field }) => (
              <CurrencyInput
                id="installmentAmountCents"
                valueCents={field.value ?? null}
                onValueChange={(cents) => field.onChange(cents || null)}
              />
            )}
          />
          <FieldError message={errors.installmentAmountCents?.message} />
        </div>
        <div>
          <Label htmlFor="totalInstallments">Número total de parcelas (opcional)</Label>
          <Input
            id="totalInstallments"
            type="number"
            min={1}
            {...register("totalInstallments", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
          />
          <FieldError message={errors.totalInstallments?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="dueDay">Dia de vencimento da parcela (opcional)</Label>
        <Input
          id="dueDay"
          type="number"
          min={1}
          max={31}
          {...register("dueDay", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          O dia do mês em que a parcela vence (ex: 10). O app calcula sozinho o próximo vencimento a cada mês.
        </p>
        <FieldError message={errors.dueDay?.message} />
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
