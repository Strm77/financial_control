-- =============================================================================
-- Financeiro Pessoal — Migration 0004
-- =============================================================================
-- Adiciona categorias padrão de despesa usadas pelo Controle de Pagamento:
-- Serviços, Empréstimo, Cartão de Crédito e Cartão de Loja (Moradia já existe
-- desde a migration 0001). "Cartão de Crédito" e "Cartão de Loja" são usadas
-- pela aplicação como gatilho para criar/vincular automaticamente um Cartão
-- (menu Faturas) com o mesmo nome da descrição do pagamento.
--
-- Insere retroativamente para todos os usuários já existentes e atualiza as
-- funções de seed (trigger de novo usuário e RPC seed_default_categories)
-- para que também sejam criadas para usuários futuros.
-- =============================================================================

insert into public.categories (user_id, name, type, icon, color, is_default)
select u.id, cat.name, 'expense', cat.icon, cat.color, true
from auth.users u
cross join (
  values
    ('Serviços', 'wrench', '#7cc6fe'),
    ('Empréstimo', 'landmark', '#e8433a'),
    ('Cartão de Crédito', 'credit-card', '#a78bfa'),
    ('Cartão de Loja', 'shopping-bag', '#fb923c')
) as cat(name, icon, color)
on conflict (user_id, name, type) do nothing;

-- =============================================================================
-- Atualiza o trigger de novo usuário para incluir as novas categorias padrão
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
    (new.id, 'Serviços', 'expense', 'wrench', '#7cc6fe', true),
    (new.id, 'Empréstimo', 'expense', 'landmark', '#e8433a', true),
    (new.id, 'Cartão de Crédito', 'expense', 'credit-card', '#a78bfa', true),
    (new.id, 'Cartão de Loja', 'expense', 'shopping-bag', '#fb923c', true),
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

-- =============================================================================
-- Atualiza a RPC de rede de segurança (seed_default_categories) da mesma forma
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
    (v_uid, 'Serviços', 'expense', 'wrench', '#7cc6fe', true),
    (v_uid, 'Empréstimo', 'expense', 'landmark', '#e8433a', true),
    (v_uid, 'Cartão de Crédito', 'expense', 'credit-card', '#a78bfa', true),
    (v_uid, 'Cartão de Loja', 'expense', 'shopping-bag', '#fb923c', true),
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

-- =============================================================================
-- Fim da migration 0004
-- =============================================================================
