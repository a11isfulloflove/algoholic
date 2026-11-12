# algoholic

A minimal platform for practicing algorithmic problems: pick a problem, write JavaScript or TypeScript in the browser, and submit it to an automated judge that runs your code in a real sandbox against visible samples and hidden tests.

It is built around a simple principle: feedback should be honest and help should be optional. Verdicts are exact — accepted, wrong answer, time limit exceeded, runtime error, compile error with line numbers. Hints are revealed one at a time, only if you ask for them. The author's reference solution unlocks only after your own accepted submission. No leaderboards, no ads, no noise.

## Features

- Problems with categories, difficulty, sample tests and hidden tests
- Run against samples or submit for full judging; `Ctrl/Cmd+Enter` to submit; drafts are saved locally per problem and language
- TypeScript is transpiled with esbuild before execution — TS and JS syntax errors become compile verdicts before any sandbox run
- Progressive hints per problem, revealed one at a time, free for logged-in users
- The author's solution, with a "why this works" note and complexity target, unlocks only after your own accepted submission — the answer is unreachable before that, server-side
- Problem of the day, random unsolved pick, and "try next" ladders between related problems
- Personal stats: progress by difficulty and category, acceptance rate, favorite language
- Full submission history with the exact code of every attempt
- 35 problems, 399 tests, 12 categories — every reference solution is re-verified by the platform's own judge (`npm run verify:solutions`)

## Project structure

```
algoholic/
├── client/             # React 19 + Vite + TypeScript frontend
│   └── src/
│       ├── pages/      # problems, problem detail, daily, stats, submissions, profile
│       ├── components/ # editor panel, dropdowns, tables, badges
│       └── api.ts      # typed fetch client built on shared types
├── server/
│   ├── prisma/         # schema, migrations, seed (35 problems), verify-solutions
│   └── src/
│       ├── routes/     # auth, problems, submissions, stats, categories
│       ├── auth/       # bcrypt hashing, JWT sessions, cookie helpers, middleware
│       └── judge/      # transpile, harness, piston client, comparison, orchestrator
├── shared/             # @algoholic/shared — types used by client and server
├── docker-compose.yml  # PostgreSQL 17 + Piston sandbox
└── package.json        # npm workspaces root
```

## Prerequisites

- Node.js (v20+)
- Docker — for PostgreSQL and the Piston sandbox

## Setup

```bash
npm install
cp server/.env.example server/.env    # set a real JWT_SECRET
npm run infra:up        # postgres + piston containers
npm run db:migrate      # apply migrations
npm run db:seed         # 35 problems · 399 tests (idempotent)
npm run judge:setup     # one-time: install node runtime into piston + smoke test
npm run dev             # http://localhost:5173 (API proxied)
```

`npm run dev:lan` exposes the dev server to other devices on your network.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start client and server concurrently |
| `npm run dev:lan` | Same, with the client reachable from the local network |
| `npm run build` | Type-check and build client and server |
| `npm run lint` | oxlint across workspaces |
| `npm test` | Server unit tests (vitest) — includes the judge's comparison logic |
| `npm run infra:up` / `infra:down` | Start / stop the docker stack |
| `npm run db:migrate` / `db:seed` / `db:studio` | Migrations, seed, Prisma Studio |
| `npm run judge:setup` | Install the node runtime into piston and smoke-test it |
| `npm run verify:solutions` | Re-judge all 35 reference solutions through the sandbox |

## How judging works

Every submission travels the same pipeline:

1. **Validate and transpile.** Input is validated with Zod; esbuild transpiles TypeScript and syntax-checks JavaScript. Broken code becomes a compile verdict without touching the sandbox.
2. **Harness.** The user's code is wrapped in a runner that calls the exported function once per test case and prints one JSON result per test. Stray `console.log` output is captured and shown back to the author in the results panel.
3. **Sandbox.** All tests execute in a single [Piston](https://github.com/engineer-man/piston) run: isolated Linux namespaces, networking disabled, per-problem time and memory caps. A hung test is identified by which results never arrived.
4. **Verdict.** Results are compared server-side against expectations. Hidden test answers never leave the server — the API reports what your code returned, never what was expected.

Comparison is canonical JSON with a small floating-point tolerance: object key order is ignored, array order is strict, and `1 !== true`. Verdicts map to the first failure — wrong answer with your output, runtime error with the message, time limit with the offending test index.

The judge is also its own quality gate: all reference solutions are fed through it programmatically before shipping, and `npm run verify:solutions` re-runs the check at any time.

## Adding problems

Problems live in `server/prisma/seed.ts` — statement, starter code for JS and TS, sample and hidden tests, hints, the reference solution with its note, a target complexity, and related slugs for the "try next" ladder. Seeding uses upserts, so it is idempotent and re-runnable. After writing or editing a problem:

```bash
npm run db:seed
npm run verify:solutions   # must pass before shipping
```

## Authentication

Accounts are username-based — no emails, no personal data. Passwords are bcrypt-hashed, sessions are httpOnly JWT cookies, and credential changes (password or username) require the current password.
