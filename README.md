# algoholic

A minimal LeetCode-style platform: algorithmic problems with categories and difficulty, and an auto-judge that runs your solution against test cases. No leaderboards, no ads, no noise — just problems.

## Structure

```
client/   React 19 + Vite + TypeScript frontend
server/   Express 5 + TypeScript API (Prisma + PostgreSQL)
shared/   Types shared between client and server
```

Infrastructure (via `docker-compose.yml`): PostgreSQL 17 + [Piston](https://github.com/engineer-man/piston) (sandboxed code execution for the judge).

## Getting started

Prerequisites: Node 20+, Docker

```bash
npm install
cp server/.env.example server/.env   # then edit: set a real JWT_SECRET
npm run infra:up        # start postgres + piston containers
npm run db:migrate      # apply prisma migrations
npm run db:seed         # seed categories + 10 problems with tests
npm run judge:setup     # one-time: install node runtime into piston + smoke test
npm run dev             # client on :5173 (proxies /api), server on :4000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run client + server concurrently |
| `npm run dev:client` / `npm run dev:server` | Run just one workspace |
| `npm run build` | Build client + server |
| `npm run lint` | Lint all workspaces (oxlint) |
| `npm run infra:up` / `npm run infra:down` | Start / stop the docker stack |
| `npm run judge:setup` | Install node into piston and run a smoke test |
| `npm run db:migrate` | Apply database migrations (dev) |
| `npm run db:seed` | Seed categories and problems (idempotent) |
| `npm run db:studio` | Browse the database in Prisma Studio |

## API

| Endpoint | Description |
|---|---|
| `GET /api/health` | Liveness check |
| `POST /api/auth/register` | Create account (email + password, min 8 chars) |
| `POST /api/auth/login` / `POST /api/auth/logout` | Session via httpOnly JWT cookie |
| `GET /api/auth/me` | Current user (requires auth) |
| `GET /api/categories` | Categories with problem counts |
| `GET /api/problems` | List problems — filters: `category`, `difficulty`, `q`, `page`, `pageSize` |
| `GET /api/problems/:slug` | Problem statement, sample tests, starter code |
