import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata = {
  title: "Definir nova senha — Financeiro Pessoal",
};

export default function UpdatePasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <UpdatePasswordForm />
    </main>
  );
}
