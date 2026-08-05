// Tipos gerados manualmente a partir de supabase/migrations/0001_init.sql.
// Caso o schema mude, atualize este arquivo (ou gere via `supabase gen types`).

export type TransactionType = "income" | "expense";
export type RecurringPaymentStatus = "active" | "paused" | "finished";
export type PaymentRecordStatus = "pending" | "paid" | "partial" | "overdue";
export type DebtStatus = "active" | "paid";
export type SavingsGoalStatus = "active" | "completed" | "paused";
export type IncomeType = "fixed" | "variable";
export type PaymentType = "fixed" | "temporary" | "variable";
export type CardType = "credito" | "loja";
export type InvoiceStatus = "aberta" | "paga";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
        };
        Update: {
          display_name?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: TransactionType;
          icon: string | null;
          color: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: TransactionType;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
        };
        Update: {
          name?: string;
          type?: TransactionType;
          icon?: string | null;
          color?: string | null;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          description: string;
          amount_cents: number;
          type: TransactionType;
          transaction_date: string;
          payment_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          description: string;
          amount_cents: number;
          type: TransactionType;
          transaction_date: string;
          payment_method?: string | null;
          notes?: string | null;
        };
        Update: {
          category_id?: string | null;
          description?: string;
          amount_cents?: number;
          type?: TransactionType;
          transaction_date?: string;
          payment_method?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      recurring_payments: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          card_id: string | null;
          description: string;
          amount_cents: number;
          due_day: number;
          frequency: "monthly";
          payment_type: PaymentType;
          status: RecurringPaymentStatus;
          start_date: string;
          end_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          card_id?: string | null;
          description: string;
          amount_cents: number;
          due_day: number;
          frequency?: "monthly";
          payment_type?: PaymentType;
          status?: RecurringPaymentStatus;
          start_date: string;
          end_date?: string | null;
          notes?: string | null;
        };
        Update: {
          category_id?: string | null;
          card_id?: string | null;
          description?: string;
          amount_cents?: number;
          due_day?: number;
          payment_type?: PaymentType;
          status?: RecurringPaymentStatus;
          start_date?: string;
          end_date?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      payment_records: {
        Row: {
          id: string;
          user_id: string;
          recurring_payment_id: string;
          reference_month: string;
          paid_at: string | null;
          amount_paid_cents: number | null;
          status: PaymentRecordStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recurring_payment_id: string;
          reference_month: string;
          paid_at?: string | null;
          amount_paid_cents?: number | null;
          status?: PaymentRecordStatus;
        };
        Update: {
          paid_at?: string | null;
          amount_paid_cents?: number | null;
          status?: PaymentRecordStatus;
        };
        Relationships: [];
      };
      debts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          creditor: string | null;
          original_amount_cents: number;
          current_balance_cents: number;
          interest_rate: number | null;
          minimum_payment_cents: number | null;
          installment_amount_cents: number | null;
          total_installments: number | null;
          initial_installments_paid: number;
          due_day: number | null;
          status: DebtStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          creditor?: string | null;
          original_amount_cents: number;
          current_balance_cents: number;
          interest_rate?: number | null;
          minimum_payment_cents?: number | null;
          installment_amount_cents?: number | null;
          total_installments?: number | null;
          initial_installments_paid?: number;
          due_day?: number | null;
          status?: DebtStatus;
          notes?: string | null;
        };
        Update: {
          name?: string;
          creditor?: string | null;
          interest_rate?: number | null;
          minimum_payment_cents?: number | null;
          installment_amount_cents?: number | null;
          total_installments?: number | null;
          due_day?: number | null;
          status?: DebtStatus;
          notes?: string | null;
        };
        Relationships: [];
      };
      debt_payments: {
        Row: {
          id: string;
          user_id: string;
          debt_id: string;
          amount_cents: number;
          payment_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          debt_id: string;
          amount_cents: number;
          payment_date: string;
          notes?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount_cents: number;
          current_amount_cents: number;
          target_date: string | null;
          status: SavingsGoalStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount_cents: number;
          current_amount_cents?: number;
          target_date?: string | null;
          status?: SavingsGoalStatus;
          notes?: string | null;
        };
        Update: {
          name?: string;
          target_amount_cents?: number;
          target_date?: string | null;
          status?: SavingsGoalStatus;
          notes?: string | null;
        };
        Relationships: [];
      };
      savings_contributions: {
        Row: {
          id: string;
          user_id: string;
          savings_goal_id: string;
          amount_cents: number;
          contribution_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          savings_goal_id: string;
          amount_cents: number;
          contribution_date: string;
          notes?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      incomes: {
        Row: {
          id: string;
          user_id: string;
          description: string;
          type: IncomeType;
          amount_cents: number;
          reference_month: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          description: string;
          type: IncomeType;
          amount_cents: number;
          reference_month: string;
          notes?: string | null;
        };
        Update: {
          description?: string;
          type?: IncomeType;
          amount_cents?: number;
          reference_month?: string;
          notes?: string | null;
        };
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          card_type: CardType;
          closing_day: number | null;
          due_day: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          card_type: CardType;
          closing_day?: number | null;
          due_day?: number | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          card_type?: CardType;
          closing_day?: number | null;
          due_day?: number | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          reference_month: string;
          attachment_path: string | null;
          status: InvoiceStatus;
          paid_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          reference_month: string;
          attachment_path?: string | null;
          status?: InvoiceStatus;
          paid_at?: string | null;
          notes?: string | null;
        };
        Update: {
          attachment_path?: string | null;
          status?: InvoiceStatus;
          paid_at?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          user_id: string;
          invoice_id: string;
          description: string;
          amount_cents: number;
          installment_current: number | null;
          installment_total: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          invoice_id: string;
          description: string;
          amount_cents: number;
          installment_current?: number | null;
          installment_total?: number | null;
        };
        Update: {
          description?: string;
          amount_cents?: number;
          installment_current?: number | null;
          installment_total?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      register_debt_payment: {
        Args: {
          p_debt_id: string;
          p_amount_cents: number;
          p_payment_date: string;
          p_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["debts"]["Row"];
      };
      register_savings_movement: {
        Args: {
          p_goal_id: string;
          p_amount_cents: number;
          p_contribution_date: string;
          p_notes?: string | null;
        };
        Returns: Database["public"]["Tables"]["savings_goals"]["Row"];
      };
      seed_default_categories: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["categories"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
