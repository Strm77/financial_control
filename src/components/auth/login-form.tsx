"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Wallet } from "lucide-react";
import Link from "next/link";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { loginAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(initialError);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(undefined);
    const result = await loginAction(values);
    if (!result.success) {
      setFormError(result.message);
      if (result.fieldErrors) {
        for (const [field, messages] of Object.entries(result.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof LoginFormValues, { message: messages[0] });
          }
        }
      }
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="size-14 rounded-brutal border-brutal bg-primary text-primary-foreground shadow-brutal grid place-items-center">
          <Wallet className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold font-display text-center">Financeiro Pessoal</h1>
        <p className="text-sm text-muted-foreground text-center">Entre com sua conta para continuar</p>
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

        <div>
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              invalid={!!errors.password}
              placeholder="Sua senha"
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

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              defaultChecked
              className="size-4 rounded border-brutal accent-primary cursor-pointer"
              {...register("rememberMe")}
            />
            Lembrar de mim
          </label>
          <Link href="/esqueci-senha" className="text-sm font-semibold underline underline-offset-2 hover:no-underline">
            Esqueci minha senha
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={isSubmitting}>
          Entrar
        </Button>
      </form>
    </div>
  );
}
