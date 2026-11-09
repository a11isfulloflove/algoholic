# algoholic

A minimal LeetCode-style platform: algorithmic problems with categories and difficulty, and an auto-judge that runs your solution against test cases. No leaderboards, no ads, no noise — just problems.

## Structure

```
client/   React 19 + Vite + TypeScript frontend
server/   Express 5 + TypeScript API
shared/   Types shared between client and server
```

Infrastructure (via `docker-compose.yml`): PostgreSQL 17 + [Piston](https://github.com/engineer-man/piston) (sandboxed code execution for the judge).

## Getting started

Prerequisites: Node 20+, Docker

```bash
npm install
npm run infra:up        # start postgres + piston containers
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
