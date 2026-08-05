-- =============================================================================
-- Financeiro Pessoal — Migration 0003
-- =============================================================================
-- Permite cadastrar uma dívida que já estava em andamento antes de começar a
-- ser controlada pelo app: quantas parcelas já foram pagas anteriormente
-- (usado para calcular a "parcela atual" corretamente desde o início).
-- =============================================================================

alter table public.debts
  add column if not exists initial_installments_paid integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'debts_initial_installments_paid_non_negative'
  ) then
    alter table public.debts
      add constraint debts_initial_installments_paid_non_negative
      check (initial_installments_paid >= 0);
  end if;
end $$;

-- =============================================================================
-- Fim da migration 0003
-- =============================================================================
