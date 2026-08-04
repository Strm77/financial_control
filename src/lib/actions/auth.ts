"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createActionClient } from "@/lib/supabase/action-client";
import { env } from "@/lib/env";
import {
  loginSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
  changePasswordSchema,
  type LoginFormValues,
  type ForgotPasswordFormValues,
  type UpdatePasswordFormValues,
  type ChangePasswordFormValues,
} from "@/lib/validations/auth";
import type { ActionResult } from "@/types/entities";

function friendlyAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("email not confirmed")) {
    return "E-mail ainda não confirmado. Verifique sua caixa de entrada.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  if (normalized.includes("password") && normalized.includes("at least")) {
    return "A senha não atende aos requisitos mínimos de segurança.";
  }
  return "Não foi possível concluir a operação. Tente novamente em instantes.";
}

export async function loginAction(values: LoginFormValues): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createActionClient({ persistSession: parsed.data.rememberMe ?? true });
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, message: friendlyAuthError(error.message) };
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(values: ForgotPasswordFormValues): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique o e-mail informado.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent("/auth/atualizar-senha")}`,
  });

  if (error) {
    return { success: false, message: friendlyAuthError(error.message) };
  }

  return {
    success: true,
    message: "Se o e-mail informado estiver cadastrado, você receberá um link de recuperação em instantes.",
  };
}

export async function updatePasswordAction(values: UpdatePasswordFormValues): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Link de recuperação inválido ou expirado. Solicite um novo link.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { success: false, message: friendlyAuthError(error.message) };
  }

  redirect("/dashboard");
}

export async function changePasswordAction(values: ChangePasswordFormValues): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { success: false, message: "Sessão expirada. Faça login novamente." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (verifyError) {
    return {
      success: false,
      message: "Senha atual incorreta.",
      fieldErrors: { currentPassword: ["Senha atual incorreta"] },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return { success: false, message: friendlyAuthError(error.message) };
  }

  return { success: true, message: "Senha alterada com sucesso." };
}
