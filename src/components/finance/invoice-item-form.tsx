"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceItemSchema, type InvoiceItemFormValues } from "@/lib/validations/invoice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { CurrencyInput } from "@/components/ui/currency-input";

export interface InvoiceItemFormProps {
  onSubmit: (values: InvoiceItemFormValues) => Promise<void>;
  onCancel: () => void;
}

export function InvoiceItemForm({ onSubmit, onCancel }: InvoiceItemFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceItemFormValues>({
    resolver: zodResolver(invoiceItemSchema),
    defaultValues: {
      description: "",
      amountCents: 0,
      installmentCurrent: null,
      installmentTotal: null,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="description">Descrição do item</Label>
        <Input id="description" invalid={!!errors.description} placeholder="Ex: Supermercado XYZ" {...register("description")} />
        <FieldError message={errors.description?.message} />
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="installmentCurrent">Parcela atual (opcional)</Label>
          <Input
            id="installmentCurrent"
            type="number"
            min={1}
            placeholder="Ex: 2"
            {...register("installmentCurrent", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
          />
          <FieldError message={errors.installmentCurrent?.message} />
        </div>
        <div>
          <Label htmlFor="installmentTotal">Total de parcelas (opcional)</Label>
          <Input
            id="installmentTotal"
            type="number"
            min={1}
            placeholder="Ex: 10"
            {...register("installmentTotal", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
          />
          <FieldError message={errors.installmentTotal?.message} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
          Adicionar item
        </Button>
      </div>
    </form>
  );
}
