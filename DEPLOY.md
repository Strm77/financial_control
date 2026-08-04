# Publicando na Vercel

O app já está pronto para deploy: frontend estático (Vite) + backend como
função serverless (`api/index.js`) + banco Postgres. Só faltam passos que só
podem ser feitos pela sua conta (Vercel e o provedor do banco) — nenhum deles
é código, é tudo clique/copiar-colar.

## 1. Crie um banco Postgres

Escolha uma opção (todas têm plano gratuito):

### Opção A — Vercel Postgres (mais simples)
1. No dashboard da Vercel, crie o projeto primeiro (passo 2 abaixo).
2. Vá em **Storage → Create Database → Postgres** (é o Neon por baixo).
3. Conecte o banco ao projeto — a Vercel injeta `POSTGRES_URL` automaticamente
   nas variáveis de ambiente. O backend já lê `POSTGRES_URL` se `DATABASE_URL`
   não existir, então **não precisa configurar nada a mais**.

### Opção B — Neon / Supabase (direto)
1. Crie um banco gratuito em [neon.tech](https://neon.tech) ou
   [supabase.com](https://supabase.com).
2. Copie a **connection string** (formato
   `postgresql://usuario:senha@host/banco?sslmode=require`).
3. Você vai colar isso na variável `DATABASE_URL` no passo 3.

## 2. Importe o projeto na Vercel

1. [vercel.com/new](https://vercel.com/new) → **Import Git Repository** →
   selecione `Strm77/financial_control`.
2. Escolha a branch que você quer publicar (ex.: `claude/web-system-login-database-52iiqq`,
   ou faça merge dela na `main` antes, como preferir).
3. Em **Framework Preset**, deixe "Other" — o arquivo `vercel.json` na raiz já
   configura tudo (build do frontend, função da API, rewrites).
4. **Não precisa mudar o Root Directory** — deixe a raiz do repositório.

## 3. Configure as variáveis de ambiente

Em **Project Settings → Environment Variables**, adicione:

| Nome | Valor |
| --- | --- |
| `DATABASE_URL` | A connection string do passo 1 (pule se usou Vercel Postgres — já vem pronto como `POSTGRES_URL`) |
| `JWT_SECRET` | Uma string aleatória forte — gere uma com o comando abaixo |

Gerar um `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Deploy

Clique em **Deploy**. A Vercel vai:
- Instalar as dependências de `backend/` e `frontend/`
- Buildar o React (`frontend/dist`)
- Publicar `api/index.js` como função serverless em `/api/*`

Na primeira requisição à API, o backend cria as tabelas automaticamente e
semeia os dois usuários iniciais:

| Usuário | Senha |
| --- | --- |
| `Brunno.` | `7753955` |
| `Carol.` | `051297` |

Não é preciso rodar nenhuma migration manual.

## 5. Depois de publicado

- Troque as senhas dos usuários seed assim que possível (não há tela de troca
  de senha ainda — se quiser, é só pedir).
- Cada redeploy é seguro: a criação de tabelas usa `CREATE TABLE IF NOT EXISTS`
  e o seed de usuários só insere quem ainda não existe.
- Se trocar de banco depois, basta atualizar `DATABASE_URL` nas env vars e
  fazer um redeploy — o schema é recriado do zero automaticamente.

## Troubleshooting

- **"Banco de dados indisponível" / 503**: confira se `DATABASE_URL` (ou
  `POSTGRES_URL`) está configurada no projeto da Vercel e se o banco aceita
  conexões externas com SSL.
- **Erro 413 ao anexar fatura em PDF**: o limite é 4MB (a Vercel limita o
  corpo da requisição a ~4.5MB nas funções serverless).
- **Timeout na leitura da fatura**: `vercel.json` já define
  `maxDuration: 30` para a função — se seu plano não permitir, ajuste esse
  valor para o máximo do seu plano.
