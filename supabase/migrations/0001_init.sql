-- =============================================================================
-- Financeiro Pessoal — Migration inicial
-- =============================================================================
-- Esta migration é idempotente onde razoável: pode ser reexecutada com segurança
-- (usa "if not exists", "or replace", "drop ... if exists" antes de recriar).
--
-- Modelo de segurança:
--   - Toda tabela de dados do usuário tem user_id uuid not null references auth.users
--   - Row Level Security habilitado em 100% das tabelas
--   - Policies separadas de SELECT / INSERT / UPDATE / DELETE, sempre com
--     auth.uid() = user_id (e "with check" em INSERT/UPDATE)
--   - Relações entre tabelas que carregam user_id usam foreign keys compostas
--     (id, user_id) para impedir referências cruzadas entre usuários no nível
--     do banco, não apenas no frontend.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Função utilitária: mantém updated_at sempre atualizado
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- TABELA: profiles
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Sem policy de INSERT/DELETE: o profile é criado exclusivamente pelo trigger
-- de novo usuário (SECURITY DEFINER) e nunca é excluído pelo cliente.

-- =============================================================================
-- TABELA: categories
-- =============================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_user_name_type_unique unique (user_id, name, type),
  -- Suporte a foreign keys compostas de outras tabelas (impede referência cruzada entre usuários)
  constraint categories_id_user_unique unique (id, user_id)
);

create index if not exists idx_categories_user_id on public.categories (user_id);
create index if not exists idx_categories_user_type on public.categories (user_id, type);

alter table public.categories enable row level security;

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories
  for select
  using (auth.uid() = user_id);

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- TABELA: transactions
-- =============================================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid,
  description text not null check (length(trim(description)) > 0),
  amount_cents bigint not null check (amount_cents > 0),
  type text not null check (type in ('income', 'expense')),
  transaction_date date not null,
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_category_same_user
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
);

create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_user_date on public.transactions (user_id, transaction_date desc);
create index if not exists idx_transactions_user_type on public.transactions (user_id, type);
create index if not exists idx_transactions_category_id on public.transactions (category_id);

alter table public.transactions enable row level security;

drop trigger if exists trg_transactions_updated_at on public.transactions;
create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select
  using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete
  using (auth.uid() = user_id);

-- Valida em banco que a categoria associada é do mesmo tipo da transação
create or replace function public.check_transaction_category_type()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_type text;
begin
  if new.category_id is not null then
    select type into v_type
    from public.categories
    where id = new.category_id and user_id = new.user_id;

    if v_type is null then
      raise exception 'Categoria inválida para este usuário';
    end if;

    if v_type <> new.type then
      raise exception 'O tipo da categoria não corresponde ao tipo da transação';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_transactions_category_type on public.transactions;
create trigger trg_transactions_category_type
  before insert or update on public.transactions
  for each row execute function public.check_transaction_category_type();

-- =============================================================================
-- TABELA: recurring_payments
-- =============================================================================
create table if not exists public.recurring_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid,
  description text not null check (length(trim(description)) > 0),
  amount_cents bigint not null check (amount_cents > 0),
  due_day integer not null check (due_day between 1 and 31),
  frequency text not null default 'monthly' check (frequency in ('monthly')),
  status text not null default 'active' check (status in ('active', 'paused', 'finished')),
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_payments_end_after_start check (end_date is null or end_date >= start_date),
  constraint recurring_payments_category_same_user
    foreign key (category_id, user_id)
    references public.categories (id, user_id),
  constraint recurring_payments_id_user_unique unique (id, user_id)
);

create index if not exists idx_recurring_payments_user_id on public.recurring_payments (user_id);
create index if not exists idx_recurring_payments_user_status on public.recurring_payments (user_id, status);
create index if not exists idx_recurring_payments_due_day on public.recurring_payments (due_day);

alter table public.recurring_payments enable row level security;

drop trigger if exists trg_recurring_payments_updated_at on public.recurring_payments;
create trigger trg_recurring_payments_updated_at
  before update on public.recurring_payments
  for each row execute function public.set_updated_at();

drop policy if exists "recurring_payments_select_own" on public.recurring_payments;
create policy "recurring_payments_select_own" on public.recurring_payments
  for select
  using (auth.uid() = user_id);

drop policy if exists "recurring_payments_insert_own" on public.recurring_payments;
create policy "recurring_payments_insert_own" on public.recurring_payments
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "recurring_payments_update_own" on public.recurring_payments;
create policy "recurring_payments_update_own" on public.recurring_payments
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "recurring_payments_delete_own" on public.recurring_payments;
create policy "recurring_payments_delete_own" on public.recurring_payments
  for delete
  using (auth.uid() = user_id);

create or replace function public.check_recurring_payment_category()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_type text;
begin
  if new.category_id is not null then
    select type into v_type
    from public.categories
    where id = new.category_id and user_id = new.user_id;

    if v_type is null then
      raise exception 'Categoria inválida para este usuário';
    end if;

    if v_type <> 'expense' then
      raise exception 'A categoria de uma cobrança recorrente deve ser do tipo despesa';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_recurring_payments_category on public.recurring_payments;
create trigger trg_recurring_payments_category
  before insert or update on public.recurring_payments
  for each row execute function public.check_recurring_payment_category();

-- =============================================================================
-- TABELA: payment_records
-- =============================================================================
create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recurring_payment_id uuid not null,
  reference_month date not null check (extract(day from reference_month) = 1),
  paid_at date,
  amount_paid_cents bigint check (amount_paid_cents is null or amount_paid_cents > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_records_recurring_month_unique unique (recurring_payment_id, reference_month),
  constraint payment_records_recurring_same_user
    foreign key (recurring_payment_id, user_id)
    references public.recurring_payments (id, user_id)
    on delete cascade
);

create index if not exists idx_payment_records_user_id on public.payment_records (user_id);
create index if not exists idx_payment_records_user_month on public.payment_records (user_id, reference_month);
create index if not exists idx_payment_records_status on public.payment_records (status);
create index if not exists idx_payment_records_recurring_id on public.payment_records (recurring_payment_id);

alter table public.payment_records enable row level security;

drop trigger if exists trg_payment_records_updated_at on public.payment_records;
create trigger trg_payment_records_updated_at
  before update on public.payment_records
  for each row execute function public.set_updated_at();

drop policy if exists "payment_records_select_own" on public.payment_records;
create policy "payment_records_select_own" on public.payment_records
  for select
  using (auth.uid() = user_id);

drop policy if exists "payment_records_insert_own" on public.payment_records;
create policy "payment_records_insert_own" on public.payment_records
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "payment_records_update_own" on public.payment_records;
create policy "payment_records_update_own" on public.payment_records
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "payment_records_delete_own" on public.payment_records;
create policy "payment_records_delete_own" on public.payment_records
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- TABELA: debts
-- =============================================================================
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  creditor text,
  original_amount_cents bigint not null check (original_amount_cents > 0),
  current_balance_cents bigint not null check (current_balance_cents >= 0),
  interest_rate numeric check (interest_rate is null or interest_rate >= 0),
  minimum_payment_cents bigint check (minimum_payment_cents is null or minimum_payment_cents > 0),
  due_day integer check (due_day is null or due_day between 1 and 31),
  status text not null default 'active' check (status in ('active', 'paid')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debts_id_user_unique unique (id, user_id)
);

create index if not exists idx_debts_user_id on public.debts (user_id);
create index if not exists idx_debts_user_status on public.debts (user_id, status);

alter table public.debts enable row level security;

drop trigger if exists trg_debts_updated_at on public.debts;
create trigger trg_debts_updated_at
  before update on public.debts
  for each row execute function public.set_updated_at();

drop policy if exists "debts_select_own" on public.debts;
create policy "debts_select_own" on public.debts
  for select
  using (auth.uid() = user_id);

drop policy if exists "debts_insert_own" on public.debts;
create policy "debts_insert_own" on public.debts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "debts_update_own" on public.debts;
create policy "debts_update_own" on public.debts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "debts_delete_own" on public.debts;
create policy "debts_delete_own" on public.debts
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- TABELA: debt_payments
-- =============================================================================
create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  debt_id uuid not null,
  amount_cents bigint not null check (amount_cents > 0),
  payment_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint debt_payments_debt_same_user
    foreign key (debt_id, user_id)
    references public.debts (id, user_id)
    on delete cascade
);

create index if not exists idx_debt_payments_user_id on public.debt_payments (user_id);
create index if not exists idx_debt_payments_debt_id on public.debt_payments (debt_id);
create index if not exists idx_debt_payments_date on public.debt_payments (payment_date desc);

alter table public.debt_payments enable row level security;

drop policy if exists "debt_payments_select_own" on public.debt_payments;
create policy "debt_payments_select_own" on public.debt_payments
  for select
  using (auth.uid() = user_id);

drop policy if exists "debt_payments_insert_own" on public.debt_payments;
create policy "debt_payments_insert_own" on public.debt_payments
  for insert
  with check (auth.uid() = user_id);

-- Sem policy de UPDATE: pagamentos de dívida são imutáveis após criados.
drop policy if exists "debt_payments_delete_own" on public.debt_payments;
create policy "debt_payments_delete_own" on public.debt_payments
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- TABELA: savings_goals
-- =============================================================================
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  target_amount_cents bigint not null check (target_amount_cents > 0),
  current_amount_cents bigint not null default 0 check (current_amount_cents >= 0),
  target_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_goals_id_user_unique unique (id, user_id)
);

create index if not exists idx_savings_goals_user_id on public.savings_goals (user_id);
create index if not exists idx_savings_goals_user_status on public.savings_goals (user_id, status);

alter table public.savings_goals enable row level security;

drop trigger if exists trg_savings_goals_updated_at on public.savings_goals;
create trigger trg_savings_goals_updated_at
  before update on public.savings_goals
  for each row execute function public.set_updated_at();

drop policy if exists "savings_goals_select_own" on public.savings_goals;
create policy "savings_goals_select_own" on public.savings_goals
  for select
  using (auth.uid() = user_id);

drop policy if exists "savings_goals_insert_own" on public.savings_goals;
create policy "savings_goals_insert_own" on public.savings_goals
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "savings_goals_update_own" on public.savings_goals;
create policy "savings_goals_update_own" on public.savings_goals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "savings_goals_delete_own" on public.savings_goals;
create policy "savings_goals_delete_own" on public.savings_goals
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- TABELA: savings_contributions
-- =============================================================================
create table if not exists public.savings_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  savings_goal_id uuid not null,
  amount_cents bigint not null check (amount_cents <> 0),
  contribution_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint savings_contributions_goal_same_user
    foreign key (savings_goal_id, user_id)
    references public.savings_goals (id, user_id)
    on delete cascade
);

create index if not exists idx_savings_contributions_user_id on public.savings_contributions (user_id);
create index if not exists idx_savings_contributions_goal_id on public.savings_contributions (savings_goal_id);
create index if not exists idx_savings_contributions_date on public.savings_contributions (contribution_date desc);

alter table public.savings_contributions enable row level security;

drop policy if exists "savings_contributions_select_own" on public.savings_contributions;
create policy "savings_contributions_select_own" on public.savings_contributions
  for select
  using (auth.uid() = user_id);

drop policy if exists "savings_contributions_insert_own" on public.savings_contributions;
create policy "savings_contributions_insert_own" on public.savings_contributions
  for insert
  with check (auth.uid() = user_id);

-- Sem policy de UPDATE: movimentações são imutáveis após criadas.
drop policy if exists "savings_contributions_delete_own" on public.savings_contributions;
create policy "savings_contributions_delete_own" on public.savings_contributions
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- RPC: register_debt_payment
-- Registra pagamento de dívida e atualiza o saldo de forma atômica.
-- SECURITY INVOKER: roda com o papel do usuário autenticado, então todas as
-- policies de RLS acima continuam se aplicando normalmente (defesa em
-- profundidade), além das validações explícitas abaixo.
-- =============================================================================
create or replace function public.register_debt_payment(
  p_debt_id uuid,
  p_amount_cents bigint,
  p_payment_date date,
  p_notes text default null
)
returns public.debts
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_debt public.debts;
  v_new_balance bigint;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'O valor do pagamento deve ser maior que zero';
  end if;

  if p_payment_date is null then
    raise exception 'Informe a data do pagamento';
  end if;

  select *
  into v_debt
  from public.debts
  where id = p_debt_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Dívida não encontrada';
  end if;

  v_new_balance := v_debt.current_balance_cents - p_amount_cents;

  if v_new_balance < 0 then
    raise exception 'O valor do pagamento é maior que o saldo devedor atual';
  end if;

  insert into public.debt_payments (user_id, debt_id, amount_cents, payment_date, notes)
  values (auth.uid(), p_debt_id, p_amount_cents, p_payment_date, p_notes);

  update public.debts
  set current_balance_cents = v_new_balance,
      status = case when v_new_balance = 0 then 'paid' else 'active' end,
      updated_at = now()
  where id = p_debt_id
  returning * into v_debt;

  return v_debt;
end;
$$;

grant execute on function public.register_debt_payment(uuid, bigint, date, text) to authenticated;

-- =============================================================================
-- RPC: register_savings_movement
-- Registra contribuição (valor positivo) ou retirada (valor negativo) em uma
-- meta financeira e atualiza o valor acumulado de forma atômica.
-- =============================================================================
create or replace function public.register_savings_movement(
  p_goal_id uuid,
  p_amount_cents bigint,
  p_contribution_date date,
  p_notes text default null
)
returns public.savings_goals
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_goal public.savings_goals;
  v_new_amount bigint;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  if p_amount_cents is null or p_amount_cents = 0 then
    raise exception 'O valor da movimentação não pode ser zero';
  end if;

  if p_contribution_date is null then
    raise exception 'Informe a data da movimentação';
  end if;

  select *
  into v_goal
  from public.savings_goals
  where id = p_goal_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Meta não encontrada';
  end if;

  v_new_amount := v_goal.current_amount_cents + p_amount_cents;

  if v_new_amount < 0 then
    raise exception 'Saldo insuficiente para essa retirada';
  end if;

  insert into public.savings_contributions (user_id, savings_goal_id, amount_cents, contribution_date, notes)
  values (auth.uid(), p_goal_id, p_amount_cents, p_contribution_date, p_notes);

  update public.savings_goals
  set current_amount_cents = v_new_amount,
      status = case
        when v_new_amount >= target_amount_cents then 'completed'
        when status = 'completed' and v_new_amount < target_amount_cents then 'active'
        else status
      end,
      updated_at = now()
  where id = p_goal_id
  returning * into v_goal;

  return v_goal;
end;
$$;

grant execute on function public.register_savings_movement(uuid, bigint, date, text) to authenticated;

-- =============================================================================
-- RPC: seed_default_categories
-- Insere o conjunto padrão de categorias para o usuário autenticado, caso
-- ainda não existam (idempotente via ON CONFLICT). Útil como rede de
-- segurança além do trigger de criação de usuário.
-- =============================================================================
create or replace function public.seed_default_categories()
returns setof public.categories
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  insert into public.categories (user_id, name, type, icon, color, is_default)
  values
    (v_uid, 'Moradia', 'expense', 'home', '#ff6b6b', true),
    (v_uid, 'Alimentação', 'expense', 'utensils', '#ffb020', true),
    (v_uid, 'Transporte', 'expense', 'car', '#7cc6fe', true),
    (v_uid, 'Saúde', 'expense', 'heart-pulse', '#e8433a', true),
    (v_uid, 'Lazer', 'expense', 'party-popper', '#a78bfa', true),
    (v_uid, 'Assinaturas', 'expense', 'repeat', '#4fb85f', true),
    (v_uid, 'Educação', 'expense', 'graduation-cap', '#f472b6', true),
    (v_uid, 'Compras', 'expense', 'shopping-bag', '#fb923c', true),
    (v_uid, 'Outros', 'expense', 'more-horizontal', '#9ca3af', true),
    (v_uid, 'Salário', 'income', 'wallet', '#4fb85f', true),
    (v_uid, 'Trabalho extra', 'income', 'briefcase', '#7cc6fe', true),
    (v_uid, 'Investimentos', 'income', 'trending-up', '#ffd23f', true),
    (v_uid, 'Reembolso', 'income', 'rotate-ccw', '#a78bfa', true),
    (v_uid, 'Outros', 'income', 'more-horizontal', '#9ca3af', true)
  on conflict (user_id, name, type) do nothing;

  return query select * from public.categories where user_id = v_uid;
end;
$$;

grant execute on function public.seed_default_categories() to authenticated;

-- =============================================================================
-- TRIGGER: criação automática de profile + categorias padrão para novo usuário
-- SECURITY DEFINER: precisa rodar com privilégios elevados porque, no momento
-- do INSERT em auth.users, ainda não existe uma sessão autenticada (auth.uid()
-- é nulo). O search_path é fixado para evitar sequestro de funções.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, type, icon, color, is_default)
  values
    (new.id, 'Moradia', 'expense', 'home', '#ff6b6b', true),
    (new.id, 'Alimentação', 'expense', 'utensils', '#ffb020', true),
    (new.id, 'Transporte', 'expense', 'car', '#7cc6fe', true),
    (new.id, 'Saúde', 'expense', 'heart-pulse', '#e8433a', true),
    (new.id, 'Lazer', 'expense', 'party-popper', '#a78bfa', true),
    (new.id, 'Assinaturas', 'expense', 'repeat', '#4fb85f', true),
    (new.id, 'Educação', 'expense', 'graduation-cap', '#f472b6', true),
    (new.id, 'Compras', 'expense', 'shopping-bag', '#fb923c', true),
    (new.id, 'Outros', 'expense', 'more-horizontal', '#9ca3af', true),
    (new.id, 'Salário', 'income', 'wallet', '#4fb85f', true),
    (new.id, 'Trabalho extra', 'income', 'briefcase', '#7cc6fe', true),
    (new.id, 'Investimentos', 'income', 'trending-up', '#ffd23f', true),
    (new.id, 'Reembolso', 'income', 'rotate-ccw', '#a78bfa', true),
    (new.id, 'Outros', 'income', 'more-horizontal', '#9ca3af', true)
  on conflict (user_id, name, type) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Fim da migration
-- =============================================================================
