import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { CategoriesManager } from "@/components/finance/categories-manager";
import { formatDateTimeBR } from "@/lib/formatters/date";
import type { Category } from "@/types/entities";

export const metadata = { title: "Configurações — Financeiro Pessoal" };

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: categories } = await supabase.from("categories").select("*").order("name", { ascending: true });

  return (
    <div>
      <PageHeader title="Configurações" description="Gerencie seus dados de acesso e informações da conta." />

      <div className="space-y-6 max-w-xl">
        <ProfileForm initialDisplayName={profile?.display_name ?? ""} />

        <ChangePasswordForm />

        <Card>
          <CardHeader>
            <CardTitle>Informações da conta</CardTitle>
          </CardHeader>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="font-semibold">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Conta criada em</dt>
              <dd className="font-semibold">{user.created_at ? formatDateTimeBR(user.created_at) : "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Último acesso</dt>
              <dd className="font-semibold">{user.last_sign_in_at ? formatDateTimeBR(user.last_sign_in_at) : "—"}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold font-display mb-4">Categorias</h2>
        <CategoriesManager
          incomeCategories={(categories ?? []).filter((c: Category) => c.type === "income")}
          expenseCategories={(categories ?? []).filter((c: Category) => c.type === "expense")}
        />
      </div>
    </div>
  );
}
