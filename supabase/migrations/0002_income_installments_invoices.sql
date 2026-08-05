-- =============================================================================
-- Financeiro Pessoal — Migration 0002
-- =============================================================================
-- Adiciona:
--   - tabela incomes (menu "Renda": renda fixa/variável somada por mês)
--   - parcelas em debts (valor da parcela, total de parcelas)
--   - payment_type e card_id em recurring_payments ("Controle de Pagamento")
--   - status "partial" em payment_records
--   - tabelas cards, invoices, invoice_items (menu "Faturas")
--   - bucket de Storage "faturas" com policies por usuário
--
-- Aditiva e idempotente onde razoável — segue o mesmo padrão de segurança da
-- migration 0001 (RLS em 100% das tabelas, foreign keys compostas (id, user_id)
-- para impedir referência cruzada entre usuários).
-- =============================================================================

-- =============================================================================
-- TABELA: incomes (Renda)
-- =============================================================================
create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null check (length(trim(description)) > 0),
  type text not null check (type in ('fixed', 'variable')),
  amount_cents bigint not null check (amount_cents > 0),
  reference_month date not null check (extract(day from reference_month) = 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_incomes_user_id on public.incomes (user_id);
create index if not exists idx_incomes_user_month on public.incomes (user_id, reference_month);

alter table public.incomes enable row level security;

drop trigger if exists trg_incomes_updated_at on public.incomes;
create trigger trg_incomes_updated_at
  before update on public.incomes
  for each row execute function public.set_updated_at();

drop policy if exists "incomes_select_own" on public.incomes;
create policy "incomes_select_own" on public.incomes
  for select
  using (auth.uid() = user_id);

drop policy if exists "incomes_insert_own" on public.incomes;
create policy "incomes_insert_own" on public.incomes
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "incomes_update_own" on public.incomes;
create policy "incomes_update_own" on public.incomes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "incomes_delete_own" on public.incomes;
create policy "incomes_delete_own" on public.incomes
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- ALTER: debts — controle de parcelas
-- =============================================================================
alter table public.debts
  add column if not exists installment_amount_cents bigint,
  add column if not exists total_installments integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'debts_installment_amount_positive'
  ) then
    alter table public.debts
      add constraint debts_installment_amount_positive
      check (installment_amount_cents is null or installment_amount_cents > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'debts_total_installments_positive'
  ) then
    alter table public.debts
      add constraint debts_total_installments_positive
      check (total_installments is null or total_installments > 0);
  end if;
end $$;

-- =============================================================================
-- TABELA: cards (cartões de crédito/loja, usados no menu Faturas)
-- =============================================================================
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  card_type text not null check (card_type in ('credito', 'loja')),
  closing_day integer check (closing_day is null or closing_day between 1 and 31),
  due_day integer check (due_day is null or due_day between 1 and 31),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_id_user_unique unique (id, user_id)
);

create index if not exists idx_cards_user_id on public.cards (user_id);

alter table public.cards enable row level security;

drop trigger if exists trg_cards_updated_at on public.cards;
create trigger trg_cards_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

drop policy if exists "cards_select_own" on public.cards;
create policy "cards_select_own" on public.cards
  for select
  using (auth.uid() = user_id);

drop policy if exists "cards_insert_own" on public.cards;
create policy "cards_insert_own" on public.cards
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "cards_update_own" on public.cards;
create policy "cards_update_own" on public.cards
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cards_delete_own" on public.cards;
create policy "cards_delete_own" on public.cards
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- ALTER: recurring_payments — vira a base do "Controle de Pagamento"
-- =============================================================================
alter table public.recurring_payments
  add column if not exists payment_type text not null default 'fixed',
  add column if not exists card_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'recurring_payments_payment_type_check'
  ) then
    alter table public.recurring_payments
      add constraint recurring_payments_payment_type_check
      check (payment_type in ('fixed', 'temporary', 'variable'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'recurring_payments_card_same_user'
  ) then
    alter table public.recurring_payments
      add constraint recurring_payments_card_same_user
      foreign key (card_id, user_id) references public.cards (id, user_id);
  end if;
end $$;

create index if not exists idx_recurring_payments_card_id on public.recurring_payments (card_id);

-- =============================================================================
-- ALTER: payment_records — adiciona status "partial"
-- =============================================================================
alter table public.payment_records drop constraint if exists payment_records_status_check;
alter table public.payment_records
  add constraint payment_records_status_check
  check (status in ('pending', 'paid', 'partial', 'overdue'));

-- =============================================================================
-- TABELA: invoices (faturas de um cartão em um mês)
-- =============================================================================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id uuid not null,
  reference_month date not null check (extract(day from reference_month) = 1),
  attachment_path text,
  status text not null default 'aberta' check (status in ('aberta', 'paga')),
  paid_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_card_month_unique unique (card_id, reference_month),
  constraint invoices_card_same_user
    foreign key (card_id, user_id)
    references public.cards (id, user_id)
    on delete cascade,
  constraint invoices_id_user_unique unique (id, user_id)
);

create index if not exists idx_invoices_user_id on public.invoices (user_id);
create index if not exists idx_invoices_card_id on public.invoices (card_id);
create index if not exists idx_invoices_user_month on public.invoices (user_id, reference_month);

alter table public.invoices enable row level security;

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

drop policy if exists "invoices_select_own" on public.invoices;
create policy "invoices_select_own" on public.invoices
  for select
  using (auth.uid() = user_id);

drop policy if exists "invoices_insert_own" on public.invoices;
create policy "invoices_insert_own" on public.invoices
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "invoices_update_own" on public.invoices;
create policy "invoices_update_own" on public.invoices
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "invoices_delete_own" on public.invoices;
create policy "invoices_delete_own" on public.invoices
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- TABELA: invoice_items (itens de uma fatura, com controle de parcelamento)
-- =============================================================================
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  invoice_id uuid not null,
  description text not null check (length(trim(description)) > 0),
  amount_cents bigint not null check (amount_cents > 0),
  installment_current integer check (installment_current is null or installment_current > 0),
  installment_total integer check (installment_total is null or installment_total > 0),
  created_at timestamptz not null default now(),
  constraint invoice_items_invoice_same_user
    foreign key (invoice_id, user_id)
    references public.invoices (id, user_id)
    on delete cascade
);

create index if not exists idx_invoice_items_user_id on public.invoice_items (user_id);
create index if not exists idx_invoice_items_invoice_id on public.invoice_items (invoice_id);

alter table public.invoice_items enable row level security;

drop policy if exists "invoice_items_select_own" on public.invoice_items;
create policy "invoice_items_select_own" on public.invoice_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "invoice_items_insert_own" on public.invoice_items;
create policy "invoice_items_insert_own" on public.invoice_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "invoice_items_update_own" on public.invoice_items;
create policy "invoice_items_update_own" on public.invoice_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "invoice_items_delete_own" on public.invoice_items;
create policy "invoice_items_delete_own" on public.invoice_items
  for delete
  using (auth.uid() = user_id);

-- =============================================================================
-- STORAGE: bucket "faturas" para anexos de fatura (privado, por usuário)
-- =============================================================================
-- Cada arquivo deve ser enviado com o caminho "{user_id}/{invoice_id}/{arquivo}",
-- para que as policies abaixo consigam restringir o acesso ao dono.
insert into storage.buckets (id, name, public)
values ('faturas', 'faturas', false)
on conflict (id) do nothing;

drop policy if exists "faturas_select_own" on storage.objects;
create policy "faturas_select_own" on storage.objects
  for select
  using (bucket_id = 'faturas' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "faturas_insert_own" on storage.objects;
create policy "faturas_insert_own" on storage.objects
  for insert
  with check (bucket_id = 'faturas' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "faturas_update_own" on storage.objects;
create policy "faturas_update_own" on storage.objects
  for update
  using (bucket_id = 'faturas' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'faturas' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "faturas_delete_own" on storage.objects;
create policy "faturas_delete_own" on storage.objects
  for delete
  using (bucket_id = 'faturas' and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- Fim da migration 0002
-- =============================================================================
