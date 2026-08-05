"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";

export function ForgotPasswordForm() {
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setFeedback(null);
    const result = await forgotPasswordAction(values);
    setFeedback({
      type: result.success ? "success" : "error",
      message: result.message ?? "",
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="size-14 neu-rounded neu-surface bg-secondary text-secondary-foreground neu-shadow grid place-items-center">
          <KeyRound className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold font-display text-center">Recuperar senha</h1>
        <p className="text-sm text-muted-foreground text-center">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-card neu-surface neu-rounded neu-shadow p-6 space-y-5"
      >
        {feedback && (
          <div
            role="alert"
            className={`neu-surface neu-rounded px-4 py-3 text-sm font-semibold ${
              feedback.type === "success" ? "bg-success text-success-foreground" : "bg-danger text-danger-foreground"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            placeholder="voce@exemplo.com"
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
          Enviar link de recuperação
        </Button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm font-semibold underline underline-offset-2 hover:no-underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Voltar para o login
        </Link>
      </form>
    </div>
  );
}
