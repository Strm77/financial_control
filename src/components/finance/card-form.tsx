"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cardSchema, CARD_TYPE_LABELS, type CardFormValues } from "@/lib/validations/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";

export interface CardFormProps {
  defaultValues?: Partial<CardFormValues>;
  onSubmit: (values: CardFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function CardForm({ defaultValues, onSubmit, onCancel, submitLabel = "Salvar" }: CardFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      cardType: defaultValues?.cardType ?? "credito",
      closingDay: defaultValues?.closingDay ?? null,
      dueDay: defaultValues?.dueDay ?? null,
      notes: defaultValues?.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <Label htmlFor="name">Nome do cartão</Label>
        <Input id="name" invalid={!!errors.name} placeholder="Ex: Nubank Crédito" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="cardType">Tipo</Label>
        <Select id="cardType" invalid={!!errors.cardType} {...register("cardType")}>
          {Object.entries(CARD_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <FieldError message={errors.cardType?.message} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="closingDay">Dia de fechamento (opcional)</Label>
          <Input
            id="closingDay"
            type="number"
            min={1}
            max={31}
            {...register("closingDay", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
          />
          <FieldError message={errors.closingDay?.message} />
        </div>
        <div>
          <Label htmlFor="dueDay">Dia de vencimento (opcional)</Label>
          <Input
            id="dueDay"
            type="number"
            min={1}
            max={31}
            {...register("dueDay", { setValueAs: (v) => (v === "" ? null : Number(v)) })}
          />
          <FieldError message={errors.dueDay?.message} />
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
