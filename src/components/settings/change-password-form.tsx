"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validations/auth";
import { changePasswordAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function ChangePasswordForm() {
  const [showPasswords, setShowPasswords] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    const result = await changePasswordAction(values);
    if (!result.success) {
      toast.error(result.message ?? "Não foi possível alterar sua senha.");
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) setError(field as keyof ChangePasswordFormValues, { message: messages[0] });
        }
      }
      return;
    }
    toast.success("Senha alterada com sucesso.");
    reset();
  }

  const type = showPasswords ? "text" : "password";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alterar senha</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Senha atual</Label>
          <Input id="currentPassword" type={type} autoComplete="current-password" invalid={!!errors.currentPassword} {...register("currentPassword")} />
          <FieldError message={errors.currentPassword?.message} />
        </div>
        <div>
          <Label htmlFor="newPassword">Nova senha</Label>
          <Input id="newPassword" type={type} autoComplete="new-password" invalid={!!errors.newPassword} {...register("newPassword")} />
          <FieldError message={errors.newPassword?.message} />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input id="confirmPassword" type={type} autoComplete="new-password" invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="size-4 rounded neu-surface accent-primary cursor-pointer"
          />
          {showPasswords ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          Mostrar senhas
        </label>

        <div>
          <Button type="submit" variant="secondary" loading={isSubmitting} disabled={isSubmitting}>
            Alterar senha
          </Button>
        </div>
      </form>
    </Card>
  );
}
