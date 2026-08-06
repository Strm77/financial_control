-- =============================================================================
-- Financeiro Pessoal — Migration 0005
-- =============================================================================
-- Permite vincular uma cobrança recorrente (Controle de Pagamento) a uma
-- Dívida existente. Quando vinculada, marcar a cobrança como paga debita o
-- valor pago do saldo devedor da dívida (mesmo efeito de um pagamento manual
-- em Dívidas). Desfazer o pagamento, corrigir o valor ou excluir a cobrança
-- reverte automaticamente o débito na dívida, mantendo o saldo consistente.
--
-- payment_records.debt_payment_id rastreia qual debt_payment foi gerado por
-- aquele registro de pagamento, para permitir a reversão exata na correção.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ALTER: recurring_payments — vínculo opcional com uma dívida
-- -----------------------------------------------------------------------------
alter table public.recurring_payments
  add column if not exists debt_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'recurring_payments_debt_same_user'
  ) then
    -- "on delete set null (debt_id)": numa FK composta, "on delete set null" sem lista de
    -- colunas zeraria TAMBÉM user_id, violando o "not null" dessa coluna. Só debt_id deve
    -- ser zerado quando a dívida vinculada é excluída (a cobrança continua existindo).
    alter table public.recurring_payments
      add constraint recurring_payments_debt_same_user
      foreign key (debt_id, user_id) references public.debts (id, user_id)
      on delete set null (debt_id);
  end if;
end $$;

create index if not exists idx_recurring_payments_debt_id on public.recurring_payments (debt_id);

-- -----------------------------------------------------------------------------
-- ALTER: debt_payments — precisa de unique (id, user_id) para suportar a FK
-- composta abaixo (padrão usado em todas as outras tabelas da base).
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'debt_payments_id_user_unique'
  ) then
    alter table public.debt_payments
      add constraint debt_payments_id_user_unique unique (id, user_id);
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- ALTER: payment_records — rastreia o debt_payment gerado (se houver)
-- -----------------------------------------------------------------------------
alter table public.payment_records
  add column if not exists debt_payment_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payment_records_debt_payment_same_user'
  ) then
    -- "on delete set null (debt_payment_id)" (sintaxe de coluna específica, PostgreSQL 15+)
    -- é necessário aqui: numa FK composta, "on delete set null" sem lista de colunas zeraria
    -- TAMBÉM user_id, violando o "not null" dessa coluna. Só debt_payment_id deve ser zerado.
    alter table public.payment_records
      add constraint payment_records_debt_payment_same_user
      foreign key (debt_payment_id, user_id) references public.debt_payments (id, user_id)
      on delete set null (debt_payment_id);
  end if;
end $$;

create index if not exists idx_payment_records_debt_payment_id on public.payment_records (debt_payment_id);

-- =============================================================================
-- FUNÇÃO INTERNA: reverte o efeito de um debt_payment específico no saldo da
-- dívida (soma o valor de volta e remove o registro). Usada pelas RPCs abaixo
-- sempre que um pagamento de cobrança vinculado a uma dívida é desfeito,
-- corrigido ou excluído.
-- =============================================================================
create or replace function public.reverse_debt_payment(p_debt_payment_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_debt_payment public.debt_payments;
begin
  select *
  into v_debt_payment
  from public.debt_payments
  where id = p_debt_payment_id and user_id = auth.uid()
  for update;

  if not found then
    return;
  end if;

  update public.debts
  set current_balance_cents = current_balance_cents + v_debt_payment.amount_cents,
      status = 'active',
      updated_at = now()
  where id = v_debt_payment.debt_id and user_id = auth.uid();

  delete from public.debt_payments where id = p_debt_payment_id and user_id = auth.uid();
end;
$$;

-- =============================================================================
-- RPC: mark_recurring_payment_paid
-- Registra (ou corrige) o pagamento de uma cobrança recorrente em um mês. Se a
-- cobrança estiver vinculada a uma dívida, debita o valor pago do saldo
-- devedor de forma atômica — revertendo primeiro um eventual pagamento
-- anterior desse mesmo mês antes de aplicar o novo valor (permite corrigir o
-- valor pago sem duplicar o débito na dívida).
-- =============================================================================
create or replace function public.mark_recurring_payment_paid(
  p_recurring_payment_id uuid,
  p_reference_month date,
  p_paid_at date,
  p_amount_paid_cents bigint,
  p_status text
)
returns public.payment_records
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_recurring public.recurring_payments;
  v_existing public.payment_records;
  v_debt public.debts;
  v_new_balance bigint;
  v_debt_payment_id uuid;
  v_record public.payment_records;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_amount_paid_cents is null or p_amount_paid_cents <= 0 then
    raise exception 'O valor pago deve ser maior que zero';
  end if;

  if p_status not in ('paid', 'partial') then
    raise exception 'Status de pagamento inválido';
  end if;

  select *
  into v_recurring
  from public.recurring_payments
  where id = p_recurring_payment_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Cobrança não encontrada';
  end if;

  select *
  into v_existing
  from public.payment_records
  where recurring_payment_id = p_recurring_payment_id
    and reference_month = p_reference_month
    and user_id = auth.uid()
  for update;

  if found and v_existing.debt_payment_id is not null then
    perform public.reverse_debt_payment(v_existing.debt_payment_id);
  end if;

  if v_recurring.debt_id is not null then
    select *
    into v_debt
    from public.debts
    where id = v_recurring.debt_id and user_id = auth.uid()
    for update;

    if not found then
      raise exception 'Dívida vinculada não encontrada';
    end if;

    v_new_balance := v_debt.current_balance_cents - p_amount_paid_cents;

    if v_new_balance < 0 then
      raise exception 'O valor pago é maior que o saldo devedor da dívida vinculada';
    end if;

    insert into public.debt_payments (user_id, debt_id, amount_cents, payment_date, notes)
    values (auth.uid(), v_recurring.debt_id, p_amount_paid_cents, p_paid_at, 'Pagamento via cobrança recorrente: ' || v_recurring.description)
    returning id into v_debt_payment_id;

    update public.debts
    set current_balance_cents = v_new_balance,
        status = case when v_new_balance = 0 then 'paid' else 'active' end,
        updated_at = now()
    where id = v_recurring.debt_id;
  end if;

  insert into public.payment_records (user_id, recurring_payment_id, reference_month, paid_at, amount_paid_cents, status, debt_payment_id)
  values (auth.uid(), p_recurring_payment_id, p_reference_month, p_paid_at, p_amount_paid_cents, p_status, v_debt_payment_id)
  on conflict (recurring_payment_id, reference_month) do update
    set paid_at = excluded.paid_at,
        amount_paid_cents = excluded.amount_paid_cents,
        status = excluded.status,
        debt_payment_id = excluded.debt_payment_id
  returning * into v_record;

  return v_record;
end;
$$;

grant execute on function public.mark_recurring_payment_paid(uuid, date, date, bigint, text) to authenticated;

-- =============================================================================
-- RPC: undo_recurring_payment
-- Desfaz o pagamento de uma cobrança recorrente em um mês. Se o pagamento
-- estava vinculado a uma dívida, reverte o débito no saldo antes de remover o
-- registro.
-- =============================================================================
create or replace function public.undo_recurring_payment(
  p_recurring_payment_id uuid,
  p_reference_month date
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_existing public.payment_records;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  select *
  into v_existing
  from public.payment_records
  where recurring_payment_id = p_recurring_payment_id
    and reference_month = p_reference_month
    and user_id = auth.uid()
  for update;

  if not found then
    return;
  end if;

  if v_existing.debt_payment_id is not null then
    perform public.reverse_debt_payment(v_existing.debt_payment_id);
  end if;

  delete from public.payment_records where id = v_existing.id;
end;
$$;

grant execute on function public.undo_recurring_payment(uuid, date) to authenticated;

-- =============================================================================
-- RPC: delete_recurring_payment
-- Exclui uma cobrança recorrente e todo o seu histórico de pagamentos
-- (cascade já existente). Antes de excluir, reverte o débito na dívida
-- vinculada para cada mês que estava pago, evitando saldo devedor incorreto.
-- =============================================================================
create or replace function public.delete_recurring_payment(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_record record;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  for v_record in
    select debt_payment_id
    from public.payment_records
    where recurring_payment_id = p_id
      and user_id = auth.uid()
      and debt_payment_id is not null
  loop
    perform public.reverse_debt_payment(v_record.debt_payment_id);
  end loop;

  delete from public.recurring_payments where id = p_id and user_id = auth.uid();
end;
$$;

grant execute on function public.delete_recurring_payment(uuid) to authenticated;

-- =============================================================================
-- Fim da migration 0005
-- =============================================================================
