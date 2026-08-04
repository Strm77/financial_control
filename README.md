# Financial Control

Sistema web de controle financeiro pessoal: login, Dashboard com gráficos e
resumos, Renda, Dívidas (com recorrência), Pagamentos Mês, Gasto Mês (com
leitura de fatura em PDF) e Configurações. Interface em **Neo-Brutalism**
(bordas grossas, sombras duras, cores chapadas), com modo claro/escuro.

## Estrutura

- `frontend/` — aplicação React (Vite + TypeScript).
- `backend/` — API em Node.js/Express, banco **Postgres** (`pg`).
- `api/` — ponto de entrada da função serverless da Vercel (reexporta o
  mesmo app Express do backend).
- `vercel.json` — configuração de build/deploy do monorepo.

## Credenciais de acesso (usuários seed)

| Usuário  | Senha   |
| -------- | ------- |
| `Brunno.` | `7753955` |
| `Carol.` | `051297` |

Os usuários são criados automaticamente (seed) na primeira vez que o backend
roda, junto com alguns pagamentos de exemplo e opções padrão de Renda.

## Como rodar localmente

### 1. Banco de dados (Postgres)

Precisa de um Postgres rodando (local, Docker, ou um serviço gratuito como
[Neon](https://neon.tech)/[Supabase](https://supabase.com)). Localmente:

```bash
createdb financial_control
```

### 2. Backend (API)

```bash
cd backend
npm install
cp .env.example .env   # ajuste DATABASE_URL, PORT e JWT_SECRET
npm start
```

A API sobe em `http://localhost:4000`. As tabelas e os dados iniciais são
criados automaticamente na primeira requisição — não há migration manual.

### 3. Frontend (React)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173` e as chamadas para `/api/*` são
redirecionadas para o backend automaticamente (proxy configurado no Vite).

## Banco de dados

O backend usa Postgres (`pg`), com tabelas para `users`, `activity_log`,
`payments`, `card_expenses`, `select_options`, `incomes` e `debts`. O schema
é criado de forma idempotente (`CREATE TABLE IF NOT EXISTS`) a cada partida
do servidor/cold start, então funciona tanto localmente quanto em ambiente
serverless.

## Publicar na Vercel

Veja o passo a passo completo em [`DEPLOY.md`](./DEPLOY.md) — cobre criação
do banco Postgres, importação do projeto e variáveis de ambiente.
