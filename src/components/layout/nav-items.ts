import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  CalendarClock,
  Landmark,
  Target,
  Tags,
  CreditCard,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/renda", label: "Renda", icon: Wallet },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/pagamentos", label: "Pagamentos", icon: CalendarClock },
  { href: "/dividas", label: "Dívidas", icon: Landmark },
  { href: "/faturas", label: "Faturas", icon: CreditCard },
  { href: "/metas", label: "Metas", icon: Target },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export const MONTH_AWARE_ROUTES = ["/dashboard", "/renda", "/transacoes", "/pagamentos", "/faturas"];
