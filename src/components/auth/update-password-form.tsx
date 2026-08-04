"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { updatePasswordSchema, type UpdatePasswordFormValues } from "@/lib/validations/auth";
import { updatePasswordAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";

export function UpdatePasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: UpdatePasswordFormValues) {
    setFormError(undefined);
    const result = await updatePasswordAction(values);
    if (!result.success) {
      setFormError(result.message);
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof UpdatePasswordFormValues, { message: messages[0] });
          }
        }
      }
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="size-14 rounded-brutal border-brutal bg-primary text-primary-foreground shadow-brutal grid place-items-center">
          <ShieldCheck className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold font-display text-center">Definir nova senha</h1>
        <p className="text-sm text-muted-foreground text-center">Escolha uma nova senha para sua conta.</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-card border-brutal rounded-brutal shadow-brutal p-6 space-y-5"
      >
        {formError && (
          <div role="alert" className="border-brutal rounded-brutal bg-danger text-danger-foreground px-4 py-3 text-sm font-semibold">
            {formError}
          </div>
        )}

        <div>
          <Label htmlFor="password">Nova senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              invalid={!!errors.password}
              className="pr-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-0 top-0 h-11 w-11 grid place-items-center cursor-pointer text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>
          <FieldError message={errors.password?.message} />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <FieldError message={errors.confirmPassword?.message} />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
          Salvar nova senha
        </Button>
      </form>
    </div>
  );
}
