import { PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata = { title: "Cofrinho — Dona Grana" };

export default function CofrinhoPage() {
  return (
    <div>
      <PageHeader title="Cofrinho" description="Seu resumo de economia, em um só lugar." />
      <EmptyState
        icon={PiggyBank}
        title="Em breve"
        description="Estamos guardando as moedinhas para essa página. Volte mais tarde."
      />
    </div>
  );
}
