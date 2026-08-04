import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail").email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha"),
  rememberMe: z.boolean().optional(),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail").email("Informe um e-mail válido"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
