# Financial Control

Sistema web em construção. Nesta primeira etapa, o sistema conta apenas com uma
tela de login — sem nenhuma funcionalidade adicional habilitada — e um banco
de dados responsável por registrar as informações que forem incorporadas ao
sistema ao longo do desenvolvimento.

## Estrutura

- `frontend/` — aplicação React (Vite + TypeScript) com a tela de login,
  estilizada com o efeito **Liquid Glass** (vidro translúcido, desfoque e
  reflexos animados).
- `backend/` — API em Node.js/Express responsável pela autenticação e pelo
  banco de dados SQLite (`node:sqlite`), onde ficam registrados os usuários e
  o histórico de eventos do sistema.

## Credenciais de acesso (usuário inicial)

| Usuário  | Senha   |
| -------- | ------- |
| `Brunno.` | `7753955` |

O usuário é criado automaticamente (seed) na primeira vez que o backend é
executado.

## Como rodar

### 1. Backend (API + banco de dados)

```bash
cd backend
npm install
cp .env.example .env   # opcional: ajuste PORT e JWT_SECRET
npm start
```

A API sobe em `http://localhost:4000`. O banco SQLite é criado automaticamente
em `backend/data/financial_control.db`.

### 2. Frontend (React)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173` e as chamadas para `/api/*` são
redirecionadas para o backend automaticamente (proxy configurado no Vite).

## Banco de dados

O backend usa SQLite (módulo nativo `node:sqlite` do Node.js) com duas
tabelas iniciais:

- `users` — usuários do sistema (login/senha com hash bcrypt).
- `activity_log` — histórico de eventos (ex.: tentativas de login), servindo
  de base para o registro de todas as informações que forem adicionadas ao
  sistema conforme novas funcionalidades forem criadas.

## Próximos passos

Este é o ponto de partida do sistema. Nenhuma funcionalidade além do login foi
implementada intencionalmente — as próximas telas e módulos serão adicionados
em cima dessa base (autenticação via JWT + banco de dados já configurados).
