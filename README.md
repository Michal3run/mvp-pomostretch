# PomoStretch

A Pomodoro timer with personalized stretching exercises during breaks. After a focus session, tell the app what hurts (neck, eyes, back…) and it selects 1–3 targeted exercises from a rule-based engine — no repeats from your last break.

**Live:** [pomo-stretch.michal3run.workers.dev](https://pomo-stretch.michal3run.workers.dev)

## Tech Stack

- [Astro](https://astro.build/) v6 — SSR on Cloudflare Workers (`output: "server"`)
- [React](https://react.dev/) v19 — Interactive islands (`client:load`)
- [TypeScript](https://www.typescriptlang.org/) v5
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Supabase](https://supabase.com/) — Auth (email/password) + PostgreSQL (RLS)
- [Cloudflare Workers](https://workers.cloudflare.com/) — Edge deployment
- [shadcn/ui](https://ui.shadcn.com/) — UI components (new-york variant)

## Core Features

| Feature                       | Description                                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pomodoro Timer**            | 25-min focus sessions with manual end option                                                                                                               |
| **Pain-Based Input**          | Quick-picks (eyes, neck, general, surprise) or free-text describing how you feel                                                                           |
| **Exercise Selection Engine** | Rule engine (`src/lib/rule-engine.ts`) filters exercises by body area tags, excludes last session's exercises, and guarantees ≥1 result via fallback chain |
| **Exercise Sequence**         | Guided 1–3 exercise cards with countdown timers, skip/done, and image illustrations                                                                        |
| **Session History**           | Full CRUD — view, annotate (PATCH), and delete past break sessions                                                                                         |
| **Idle Break**                | Optional 3/5/10-min timer after exercises before returning to work                                                                                         |

## Project Structure

```
src/
├── pages/               # Astro routes
│   ├── api/             # REST endpoints (auth/, session-history/, break-input)
│   ├── dashboard.astro  # Main timer view
│   ├── break-input.astro
│   ├── exercise-sequence.astro
│   └── history.astro
├── components/
│   ├── ui/              # shadcn/ui primitives
│   ├── auth/            # React auth forms
│   ├── hooks/           # Custom React hooks
│   ├── ExerciseSequence.tsx   # Exercise flow (React island)
│   └── HistoryList.tsx        # Session history (React island)
├── lib/
│   ├── supabase.ts      # Supabase client factory
│   ├── rule-engine.ts   # Exercise selection logic
│   ├── session-storage.ts     # Last session no-repeat IDs
│   ├── exercise-storage.ts    # In-progress exercise persistence
│   └── timer-storage.ts       # Pomodoro timer persistence
├── layouts/
├── middleware.ts         # Auth guard for protected routes
└── types.ts             # Shared DTOs
supabase/
└── migrations/          # 8 PostgreSQL migrations (exercise table, break_session, RLS, seeds)
context/
└── foundation/          # PRD, roadmap, test plan, tech stack, lessons
```

## Database Schema & Migrations

The project uses **8 Supabase migrations** in `supabase/migrations/`:

| Table           | Purpose                                                       | RLS                                             |
| --------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| `exercise`      | Ergonomic exercise catalog (35+ exercises, 5 body areas)      | SELECT for `authenticated`                      |
| `break_session` | User's break history (input, tags, selected exercises, stats) | Per-operation per-user (`auth.uid() = user_id`) |

Both tables have Row Level Security enabled with granular per-operation policies.

## Getting Started

### Prerequisites

- Node.js v22.14.0 (see `.nvmrc`)
- npm

### Setup

```bash
# Install dependencies
npm install

# Create environment files
cp .env.example .env
cp .env.example .dev.vars

# Add your Supabase credentials to .env and .dev.vars:
# SUPABASE_URL=https://<project-ref>.supabase.co
# SUPABASE_KEY=<anon-key>

# Start development server (Cloudflare workerd runtime)
npm run dev
```

### Local Supabase (optional)

```bash
npx supabase init
npx supabase start
# Copy credentials from CLI output to .env and .dev.vars
npx supabase db push   # Apply migrations
```

## Available Commands

| Command            | Description                           |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Start dev server (Cloudflare workerd) |
| `npm run build`    | Production build                      |
| `npm run preview`  | Preview production build              |
| `npm run test`     | Run Vitest unit tests                 |
| `npm run test:e2e` | Run Playwright E2E tests              |
| `npm run lint`     | ESLint with type-checked rules        |
| `npm run lint:fix` | Auto-fix ESLint issues                |
| `npm run format`   | Prettier formatting                   |

## Testing

- **Unit tests** (`src/lib/rule-engine.test.ts`): Exercise selection logic — tag matching, no-repeat filter, fallback chain, duration sorting.
- **E2E tests** (`tests/e2e/us-01.spec.ts`): Full Pomodoro cycle — signup → session → break → exercise sequence with neck-tag verification → resume.
- **RLS integration** (`tests/e2e/rls-security.spec.ts`): Multi-tenant isolation — User B cannot read or delete User A's break sessions.

## Deployment

Deployed to [Cloudflare Workers](https://workers.cloudflare.com/).

| Target         | Command                                                        | URL                                       |
| -------------- | -------------------------------------------------------------- | ----------------------------------------- |
| **Dev**        | `npm run build && npx wrangler deploy --name pomo-stretch-dev` | `pomo-stretch-dev.michal3run.workers.dev` |
| **Production** | `npm run build && npx wrangler deploy`                         | `pomo-stretch.michal3run.workers.dev`     |

Set `SUPABASE_URL` and `SUPABASE_KEY` as Cloudflare secrets:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_KEY
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint + build on every push/PR to `master`. Requires `SUPABASE_URL` and `SUPABASE_KEY` as GitHub repository secrets.

## Project Documentation

Planning and design artifacts live in `context/foundation/`:

- [`prd.md`](context/foundation/prd.md) — Product Requirements Document
- [`roadmap.md`](context/foundation/roadmap.md) — Implementation roadmap
- [`test-plan.md`](context/foundation/test-plan.md) — Risk-based test plan
- [`tech-stack.md`](context/foundation/tech-stack.md) — Technology decisions
- [`lessons.md`](context/foundation/lessons.md) — Lessons learned during development

## License

MIT
