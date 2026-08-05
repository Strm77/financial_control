# Financeiro Pessoal

Aplicativo web de gerenciamento financeiro pessoal para **dois usuários previamente cadastrados**, com isolamento de dados garantido pelo PostgreSQL via **Row Level Security (RLS)** — não apenas por filtros no frontend.

Construído com Next.js 16 (App Router), React 19, TypeScript estrito, Tailwind CSS, Supabase (Postgres + Auth), React Hook Form, Zod, Recharts e um design system próprio em estilo **Neo Brutalism**.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, Turbopack)
- **React 19** + **TypeScript** (`strict: true`)
- **Tailwind CSS 4** com tokens de design em CSS custom properties
- **Supabase**: Postgres + Auth (e-mail/senha) + Row Level Security
- **@supabase/ssr** para autenticação em Server Components, Server Actions e middleware
- **React Hook Form** + **Zod** (validação no cliente e no servidor)
- **Recharts** para os gráficos do dashboard
- **Lucide React** para ícones
- **date-fns** para datas (locale `pt-BR`)
- **Sonner** para notificações (toasts)
- **Vitest** para testes unitários
- Primitivas acessíveis do **Radix UI** (Dialog / AlertDialog) com visual 100% customizado

Não usa Firebase, Prisma, MongoDB, banco local, `localStorage` como fonte de dados, autenticação manual, `service_role` no navegador ou dados financeiros mockados.

## Estrutura do projeto

```text
src/
  app/
    login/                      página de login (pública)
    esqueci-senha/               recuperação de senha (pública)
    auth/callback/                route handler que troca o "code" por sessão
    auth/atualizar-senha/         definir nova senha após o link de recuperação
    (app)/                        grupo de rotas privadas (protegidas por middleware)
      layout.tsx                 layout privado: sidebar, header, bottom nav
      dashboard/
      renda/                      renda fixa/variável do mês
      transacoes/
      pagamentos/                 "Controle de Pagamento" (fixa/temporária/variável)
      dividas/                    com controle de parcelas
      faturas/                    cartões e faturas com anexo (Supabase Storage)
      metas/
      categorias/
      configuracoes/
  components/
    ui/                          Button, Input, Select, Card, Dialog, MonthPicker...
    layout/                      Sidebar, BottomNav, Header, LogoutButton
    finance/                     formulários e managers de cada domínio
    auth/                        formulários de login / recuperação de senha
    settings/                    formulários de configurações
  lib/
    supabase/                    clients (browser, server, middleware, action)
    validations/                 schemas Zod (client + server)
    formatters/                  moeda (BRL/centavos) e datas (pt-BR)
    finance/                     funções puras: vencimentos, metas, agregações
    actions/                     Server Actions (todas as escritas no banco)
  hooks/
  types/
supabase/
  migrations/
    0001_init.sql                 schema inicial, RLS, policies, triggers, RPCs
    0002_income_installments_invoices.sql   renda, parcelas de dívida, controle de
                                             pagamento (tipo/parcial), cartões e faturas
                                             (+ bucket de Storage "faturas")
    0003_debt_installment_offset.sql        permite cadastrar dívida já em andamento
                                             (saldo inicial e parcelas já pagas)
    0004_payment_categories.sql             categorias padrão Serviços, Empréstimo,
                                             Cartão de Crédito e Cartão de Loja
```

- **Server Components por padrão**; Client Components apenas onde há interação, formulário, gráfico ou APIs do navegador.
- **Todas as escritas** (criar, editar, excluir, marcar como pago, registrar pagamento de dívida, contribuir para meta) passam por **Server Actions** em `src/lib/actions/*`, que sempre obtêm o usuário autenticado a partir da sessão no servidor (`supabase.auth.getUser()`) — o `user_id` **nunca** é aceito vindo do formulário/cliente.
- Valores monetários são armazenados e manipulados como **inteiros em centavos** (`amount_cents`, `current_balance_cents` etc.), nunca como float. Veja `src/lib/formatters/currency.ts`.

## Segurança e isolamento entre os dois usuários

Este é o requisito mais importante do projeto, então vale destacar como ele é garantido:

1. **Toda tabela de dados** tem `user_id uuid not null references auth.users(id) on delete cascade`.
2. **RLS habilitado em 100% das tabelas**, com políticas separadas de `SELECT`, `INSERT`, `UPDATE` e `DELETE`, todas exigindo `auth.uid() = user_id` (e `WITH CHECK` em `INSERT`/`UPDATE`).
3. Tabelas que se relacionam entre si (ex: `transactions.category_id → categories.id`) usam **foreign keys compostas** `(id, user_id)` para impedir que uma transação referencie uma categoria de outro usuário — a validação não depende só da RLS, o próprio schema do banco recusa a referência cruzada.
4. Operações que exigem consistência (registrar pagamento de dívida, registrar contribuição/retirada de meta) usam **funções RPC transacionais** (`register_debt_payment`, `register_savings_movement`) que validam a posse do registro e atualizam o saldo atomicamente.
5. O código da aplicação **nunca usa a `service_role` key** — em nenhum lugar, nem no servidor. Toda leitura/escrita usa a chave anônima pública autenticada com a sessão do usuário via cookies, então mesmo um bug no código da aplicação não consegue contornar o RLS.
6. Os filtros `.eq("user_id", user.id)` que você verá no código são um reforço de clareza/performance — a proteção real está nas *policies* do Postgres.

## Funcionalidades por menu

- **Renda**: lançamentos de renda fixa (salário) e variável (freelance) por mês, somados automaticamente como a renda do mês selecionado.
- **Controle de Pagamento** (`/pagamentos`): cobranças com tipo **fixa** (recorrente sem fim), **temporária** (recorrente com data de término) ou **variável** (valor muda a cada mês). Traz um mini-dashboard "Meus Pagamentos" com total pendente, total pago, renda total do mês e renda restante (renda − pago − pendente). O status **pago/parcial** é inferido automaticamente comparando o valor pago com o valor esperado; se o valor pago for menor mas você marcar o toggle **"Possui desconto?"** no momento de registrar o pagamento, o status vira **Pago** em vez de **Parcial**. O **desconto** (ou acréscimo, se pagou mais) é calculado como `valor esperado − valor pago` e exibido junto ao lançamento. O dia de vencimento é escolhido num calendário, mas só o *dia do mês* é usado (não uma data fixa) — o app recalcula sozinho o próximo vencimento a cada mês, inclusive ajustando para o último dia válido (ex: dia 31 em fevereiro vira dia 28). Quando a categoria escolhida é **Cartão de Crédito** ou **Cartão de Loja**, o app cria/vincula automaticamente um Cartão (menu Faturas) com o mesmo nome da descrição — não precisa escolher manualmente.
- **Dívidas**: além do saldo devedor, é possível informar valor da parcela e número total de parcelas — a parcela atual é sempre calculada a partir de quantos pagamentos já foram registrados (nunca fica dessincronizada). O dia de vencimento funciona do mesmo jeito que em Pagamentos.
- **Faturas**: cadastre seus cartões (crédito ou loja) e, para cada cartão, crie a fatura do mês. É possível anexar o PDF/imagem da fatura (armazenado no Supabase Storage, privado por usuário) e lançar os itens manualmente numa tabela, incluindo o controle de parcela atual/total de compras parceladas.

## Configuração passo a passo

### 1. Criar o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (gratuita).
2. Clique em **New Project**, escolha uma organização, defina nome, senha do banco e região.
3. Aguarde o provisionamento (1-2 minutos).

### 2. Executar as migrations SQL

1. No painel do Supabase, abra **SQL Editor**.
2. Cole todo o conteúdo de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) e execute (**Run**).
3. Em seguida, numa nova query, cole todo o conteúdo de [`supabase/migrations/0002_income_installments_invoices.sql`](./supabase/migrations/0002_income_installments_invoices.sql) e execute. Essa migration adiciona: menu Renda, parcelas em Dívidas, o novo Controle de Pagamento (tipo fixa/temporária/variável e status parcial) e o menu Faturas (cartões, faturas e itens) — **incluindo a criação automática do bucket de Storage `faturas`** (privado, com policies por usuário) via `insert into storage.buckets`.
4. Cole o conteúdo de [`supabase/migrations/0003_debt_installment_offset.sql`](./supabase/migrations/0003_debt_installment_offset.sql) e execute. Ela permite cadastrar uma dívida que já estava em andamento, informando o saldo devedor atual e quantas parcelas já foram pagas antes de começar a usar o app.
5. Por fim, cole o conteúdo de [`supabase/migrations/0004_payment_categories.sql`](./supabase/migrations/0004_payment_categories.sql) e execute. Adiciona as categorias padrão **Serviços**, **Empréstimo**, **Cartão de Crédito** e **Cartão de Loja** — as duas últimas são usadas pelo Controle de Pagamento para criar/vincular automaticamente um Cartão (menu Faturas). Essa migration atualiza também os usuários já existentes, não só os futuros.
6. As migrations são idempotentes onde razoável (`create table if not exists`, `drop policy if exists` + `create policy`, `create or replace function`) — podem ser executadas novamente sem duplicar objetos.
7. Confirme que não houve erros e que as tabelas apareceram em **Table Editor**.
8. Confirme também que o bucket foi criado: menu lateral → **Storage** → deve aparecer um bucket chamado **faturas** (privado). Se por algum motivo ele não aparecer (raro, depende de permissões do plano), crie manualmente: **Storage → New bucket → nome `faturas` → Private** — as policies de acesso já foram criadas pela migration e funcionam independente de quando o bucket foi criado.

> Alternativamente, com a [Supabase CLI](https://supabase.com/docs/guides/cli) instalada: `supabase link --project-ref <seu-projeto>` e depois `supabase db push` (aplica todas as migrations da pasta de uma vez).

### 3. Configurar URL e redirect URLs do Auth

Em **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (ajuste depois para a URL da Vercel).
- **Redirect URLs**: adicione:
  - `http://localhost:3000/auth/callback`
  - `https://SEU-PROJETO.vercel.app/auth/callback` (depois do deploy)

Em **Authentication → Providers → Email**, mantenha apenas **Email** habilitado. Não há necessidade de habilitar provedores OAuth.

### 4. Criar manualmente os dois usuários

Em **Authentication → Users → Add user → Create new user**:

- Crie o usuário A com e-mail e senha definitivos.
- Crie o usuário B com e-mail e senha definitivos.
- Marque **Auto Confirm User** para não depender de e-mail de confirmação.

Ao criar cada usuário, o trigger `on_auth_user_created` (definido na migration) cria automaticamente:
- um registro em `profiles`;
- o conjunto de **categorias padrão** (9 de despesa + 5 de receita) para aquele usuário.

Não existe cadastro público na aplicação — a tela de login não tem link de "criar conta".

### 5. Configurar variáveis de ambiente localmente

```bash
cp .env.example .env.local
```

Preencha com os dados do seu projeto (**Project Settings → API**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Use a chave **anon/public**, nunca a `service_role`. O app valida essas variáveis no boot (`src/lib/env.ts`) e lança um erro claro em desenvolvimento se alguma estiver ausente.

### 6. Executar o projeto localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) — você será redirecionado para `/login`. Entre com um dos dois usuários criados no passo 4.

Outros comandos úteis:

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest (funções puras)
npm run build        # build de produção
```

### 7. Enviar para o GitHub

```bash
git add .
git commit -m "Configuração inicial"
git push -u origin main
```

### 8. Importar o repositório na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e importe o repositório do GitHub.
2. O framework Next.js é detectado automaticamente — não é necessário `vercel.json`.

### 9. Configurar as variáveis na Vercel

Em **Project Settings → Environment Variables**, adicione (para Production, Preview e Development):

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-public-key
NEXT_PUBLIC_SITE_URL=https://SEU-PROJETO.vercel.app
```

### 10. Publicar

Clique em **Deploy**. Ao final, você terá uma URL do tipo `https://seu-projeto.vercel.app`.

### 11. Adicionar a URL da Vercel às URLs permitidas no Supabase

Volte em **Authentication → URL Configuration** no Supabase e:

- Atualize **Site URL** para `https://seu-projeto.vercel.app`.
- Garanta que `https://seu-projeto.vercel.app/auth/callback` esteja em **Redirect URLs**.

Sem isso, o login funciona (é feito por cookie de sessão direto), mas o fluxo de **recuperação de senha** (que depende de redirect) falhará em produção.

### 12. Testar o isolamento entre os dois usuários

Roteiro de teste manual (faça isso antes de considerar o projeto "pronto"):

1. Entre com o **usuário A**.
2. Crie: uma transação, uma cobrança recorrente, uma dívida (com um pagamento) e uma meta (com uma contribuição).
3. Clique em **Sair**.
4. Entre com o **usuário B**.
5. Confirme que **nenhum** registro do usuário A aparece em Dashboard, Transações, Pagamentos, Dívidas, Metas ou Categorias.
6. Crie dados equivalentes para o usuário B.
7. Saia e entre novamente com o usuário A — confirme que ele **não vê** os dados criados pelo usuário B.
8. Tente forçar uma violação: com o usuário B logado, abra o DevTools e tente uma chamada direta ao Supabase (via `fetch`/console) pedindo um `id` de transação que pertence ao usuário A (por exemplo, copiando o UUID do passo 2). O retorno deve ser vazio/negado — o Postgres bloqueia por RLS, independente do que o frontend pediu.

## Auditoria de RLS (SQL)

Rode estas queries no **SQL Editor** do Supabase sempre que quiser auditar o isolamento:

```sql
-- 1. Quais tabelas têm RLS habilitado
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2. Quais policies existem, por tabela e comando
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- 3. Registros com user_id nulo (não deveria haver nenhum, a coluna é NOT NULL)
select 'transactions' as tabela, count(*) from public.transactions where user_id is null
union all select 'categories', count(*) from public.categories where user_id is null
union all select 'recurring_payments', count(*) from public.recurring_payments where user_id is null
union all select 'payment_records', count(*) from public.payment_records where user_id is null
union all select 'debts', count(*) from public.debts where user_id is null
union all select 'debt_payments', count(*) from public.debt_payments where user_id is null
union all select 'savings_goals', count(*) from public.savings_goals where user_id is null
union all select 'savings_contributions', count(*) from public.savings_contributions where user_id is null
union all select 'incomes', count(*) from public.incomes where user_id is null
union all select 'cards', count(*) from public.cards where user_id is null
union all select 'invoices', count(*) from public.invoices where user_id is null
union all select 'invoice_items', count(*) from public.invoice_items where user_id is null;

-- 4. Relações cruzadas entre usuários (não deveria retornar nenhuma linha)
select t.id, t.user_id as transacao_user, c.user_id as categoria_user
from public.transactions t
join public.categories c on c.id = t.category_id
where t.user_id <> c.user_id;

select rp.id, rp.user_id as pagamento_user, c.user_id as categoria_user
from public.recurring_payments rp
join public.categories c on c.id = rp.category_id
where rp.user_id <> c.user_id;

select pr.id, pr.user_id as registro_user, rp.user_id as cobranca_user
from public.payment_records pr
join public.recurring_payments rp on rp.id = pr.recurring_payment_id
where pr.user_id <> rp.user_id;

select dp.id, dp.user_id as pagamento_user, d.user_id as divida_user
from public.debt_payments dp
join public.debts d on d.id = dp.debt_id
where dp.user_id <> d.user_id;

select sc.id, sc.user_id as contribuicao_user, sg.user_id as meta_user
from public.savings_contributions sc
join public.savings_goals sg on sg.id = sc.savings_goal_id
where sc.user_id <> sg.user_id;

select rp.id, rp.user_id as pagamento_user, c.user_id as cartao_user
from public.recurring_payments rp
join public.cards c on c.id = rp.card_id
where rp.user_id <> c.user_id;

select i.id, i.user_id as fatura_user, c.user_id as cartao_user
from public.invoices i
join public.cards c on c.id = i.card_id
where i.user_id <> c.user_id;

select ii.id, ii.user_id as item_user, i.user_id as fatura_user
from public.invoice_items ii
join public.invoices i on i.id = ii.invoice_id
where ii.user_id <> i.user_id;
```

Todas as queries acima devem retornar **zero linhas** nas seções 3 e 4 — se retornarem alguma, há um problema de integridade a investigar.

## Diagnóstico de problemas comuns

**"Variável de ambiente ausente" ao rodar `npm run dev`**
Verifique se `.env.local` existe e contém `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` preenchidos (copie de `.env.example`). Reinicie o servidor de desenvolvimento após editar `.env.local`.

**Login funciona localmente mas a recuperação de senha falha em produção**
O link de recuperação de senha depende de `NEXT_PUBLIC_SITE_URL` (usado para montar o `redirectTo`) **e** da URL estar cadastrada em **Authentication → URL Configuration → Redirect URLs** no Supabase. Confirme os dois passos 9 e 11 acima.

**Erro no `/auth/callback` ("auth_callback_failed")**
Geralmente significa que o link de recuperação expirou (válido por tempo limitado) ou que a `Redirect URL` usada não está na lista permitida do Supabase. Solicite um novo link.

**Sessão não persiste / usuário é deslogado a cada navegação**
Confirme que o `proxy.ts` (middleware) está na raiz de `src/` e que o `matcher` não está excluindo as rotas da aplicação. O middleware é responsável por renovar o cookie de sessão (`supabase.auth.getUser()`) a cada requisição.

**"Lembrar de mim" desmarcado, mas a sessão persiste depois de fechar o navegador**
O comportamento depende do navegador: alguns navegadores restauram a sessão anterior ao reabrir (não fecham "de verdade" as abas). O cookie é gravado como cookie de sessão (sem `Max-Age`) quando a opção está desmarcada — verifique em DevTools → Application → Cookies.

**Erro de política RLS ao inserir/editar (`new row violates row-level security policy`)**
Normalmente indica que o `user_id` enviado não é igual a `auth.uid()`. Como toda escrita passa por Server Actions que sempre usam o usuário da sessão, isso só deve acontecer se a migration não foi executada corretamente — confira a auditoria de RLS acima.

**Build falha na Vercel por variável de ambiente ausente**
As variáveis `NEXT_PUBLIC_*` precisam existir em **todos** os ambientes usados (Production/Preview/Development) nas configurações do projeto na Vercel.

**Erro ao anexar fatura ("Não foi possível enviar o arquivo")**
Confirme que a migration `0002` foi executada (ela cria o bucket `faturas` e as policies de acesso). Se o bucket existir mas o upload falhar mesmo assim, verifique em **Storage → faturas → Policies** se as 4 policies (`faturas_select_own`, `faturas_insert_own`, `faturas_update_own`, `faturas_delete_own`) estão presentes — o app sempre envia o arquivo com o caminho `{user_id}/{invoice_id}/arquivo`, que é exatamente o que as policies exigem.

## Testes

```bash
npm run test
```

Cobre as funções puras mais importantes (`src/lib/formatters` e `src/lib/finance`):

- conversão de reais ⇄ centavos e formatação em BRL;
- cálculo do último dia válido do mês (ex: cobrança no dia 31 em fevereiro);
- cálculo de próximo vencimento (inclusive virada de mês/ano);
- cálculo de progresso e valor mensal necessário para metas;
- agregação mensal de receitas/despesas sem misturar meses diferentes;
- cálculo de parcela atual/total de dívidas e compras parceladas;
- inferência automática de status pago/parcial e cálculo de desconto no Controle de Pagamento.

## Design: Neo Brutalism

Tokens de design (cores, bordas, sombras) ficam em `src/app/globals.css` como CSS custom properties (`--background`, `--primary`, `--border`, `--shadow` etc.), consumidas pelo Tailwind via `@theme inline`. Características:

- bordas pretas grossas (3px) e sombras duras sem blur (`box-shadow: 5px 5px 0 0 var(--border)`);
- sem gradientes, sem glassmorphism, sem sombras suaves;
- hover "empurra" o elemento (reduz deslocamento/sombra) via a classe utilitária `.press-brutal`;
- foco de teclado sempre visível (`outline` de 3px em `--secondary`);
- suporte a tema claro/escuro via `data-theme` no elemento raiz.

## Limitações conhecidas do MVP

- Sem cadastro público (por design) — os dois usuários são criados manualmente no Supabase Dashboard.
- Sem exclusão de conta (por design, conforme escopo do MVP).
- Sem geração automática mensal de `payment_records` via cron — o status de cobranças recorrentes (e de dívidas) é calculado visualmente a partir de `due_day` e do histórico de pagamentos.
- A taxa de juros de dívidas é apenas informativa (sem cálculo de juros compostos automático).
- O anexo de fatura é um arquivo de referência (PDF/imagem) com itens digitados manualmente — não há leitura/extração automática (OCR) do conteúdo do arquivo.
