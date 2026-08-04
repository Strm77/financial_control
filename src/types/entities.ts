import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type RecurringPayment = Database["public"]["Tables"]["recurring_payments"]["Row"];
export type PaymentRecord = Database["public"]["Tables"]["payment_records"]["Row"];
export type Debt = Database["public"]["Tables"]["debts"]["Row"];
export type DebtPayment = Database["public"]["Tables"]["debt_payments"]["Row"];
export type SavingsGoal = Database["public"]["Tables"]["savings_goals"]["Row"];
export type SavingsContribution = Database["public"]["Tables"]["savings_contributions"]["Row"];

export interface ActionResult<T = undefined> {
  success: boolean;
  message?: string;
  data?: T;
  fieldErrors?: Record<string, string[]>;
}
