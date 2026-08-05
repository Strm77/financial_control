import {
  PiggyBank,
  CreditCard,
  Wallet,
  Landmark,
  LayoutDashboard,
  CalendarClock,
  Target,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Cor de destaque (glow) exclusiva deste item quando ativo/hover. */
  glow: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/cofrinho", label: "Cofrinho", icon: PiggyBank, glow: "#d4a437" },
  { href: "/faturas", label: "Faturas", icon: CreditCard, glow: "#8b5cf6" },
  { href: "/renda", label: "Renda", icon: Wallet, glow: "#2fa66b" },
  { href: "/dividas", label: "Dívidas", icon: Landmark, glow: "#c2542e" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, glow: "#3b82f6" },
  { href: "/pagamentos", label: "Pagamentos", icon: CalendarClock, glow: "#e08a2c" },
  { href: "/metas", label: "Metas", icon: Target, glow: "#22b8b0" },
  { href: "/configuracoes", label: "Configurações", icon: Settings, glow: "#7b8794" },
];
