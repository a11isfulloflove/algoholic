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
| `npm test` | Run server unit tests (vitest) |
| `npm run infra:up` / `npm run infra:down` | Start / stop the docker stack |
| `npm run judge:setup` | Install node into piston and run a smoke test |
| `npm run db:migrate` | Apply database migrations (dev) |
| `npm run db:seed` | Seed categories and problems (idempotent) |
| `npm run db:studio` | Browse the database in Prisma Studio |

## The judge

Solutions run in a [Piston](https://github.com/engineer-man/piston) sandbox (isolated Linux namespaces, no network, CPU/memory/time caps). Flow:

1. Server validates and transpiles the submission (esbuild; TS and JS syntax errors become compile errors)
2. User code is wrapped in a harness that calls the exported function with each test case and prints one JSON result per test
3. All tests execute in one sandbox run (per-problem time limit + headroom)
4. Results are compared server-side (canonical JSON, key-order-insensitive, float tolerance); hidden test expectations never leave the server

## The app

| Page | What |
|---|---|
| `/problems` | Browse, filter (category / difficulty / solved / search), solved ✓ marks |
| `/problems/:slug` | Statement + samples on the left, CodeMirror editor with Run/Submit on the right (`Ctrl/Cmd+Enter` to submit), drafts saved locally |
| `/profile` | Your emoji avatar + name, progress by difficulty and category, acceptance rate, recent submissions |
| `/submissions` | Full submission history with code viewer |

Users pick a username, an emoji avatar and an optional display name at registration (editable on the profile page) — no personal data collected.

## API

| Endpoint | Description |
|---|---|
| `GET /api/health` | Liveness check |
| `POST /api/auth/register` | Create account (username, password, optional name + emoji avatar) |
| `POST /api/auth/login` / `POST /api/auth/logout` | Session via httpOnly JWT cookie |
| `GET /api/auth/me` · `PATCH /api/auth/me` | Current user · update name/avatar |
| `GET /api/categories` | Categories with problem counts |
| `GET /api/problems` | List — filters: `category`, `difficulty`, `status` (solved/unsolved), `q`, `page` |
| `GET /api/problems/:slug` | Statement, samples, starter code, solved flag |
| `POST /api/problems/:slug/run` | Run code against sample tests (requires auth) |
| `POST /api/problems/:slug/submit` | Submit for judging against all tests (requires auth) |
| `GET /api/submissions` | Own history — filter: `problem`, `page` · `GET /api/submissions/:id` for code |
| `GET /api/stats` | Personal progress: solved by difficulty and category, acceptance rate |
