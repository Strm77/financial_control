import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Recuperar senha — Financeiro Pessoal",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <ForgotPasswordForm />
    </main>
  );
}
