import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Entrar — Financeiro Pessoal",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialError =
    params.error === "auth_callback_failed"
      ? "Não foi possível concluir a operação. O link pode ter expirado — tente novamente."
      : undefined;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <LoginForm initialError={initialError} />
    </main>
  );
}
