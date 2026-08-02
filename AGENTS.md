# Repository Guidelines

PomoStretch is an Astro 6 SSR app (React 19 islands, Tailwind 4, Supabase auth, shadcn/ui) deployed to Cloudflare Workers. See `@README.md` for setup, stack, and project structure; `@src/middleware.ts` and `@src/lib/supabase.ts` for the auth flow. This file (`AGENTS.md`) is the canonical agent doc.

## Hard rules

- API routes (`src/pages/api/**`) must export `const prerender = false` — the app is full SSR (`output: "server"`), so a missing flag silently prerenders the route.
- Read secrets through `astro:env/server` (declared in `astro.config.mjs` `env.schema`), never `import.meta.env` on the client. Keep `SUPABASE_URL` / `SUPABASE_KEY` in `.env` (Node) or `.dev.vars` (Cloudflare) — both gitignored, never committed.
- Every new Supabase table needs RLS enabled with granular per-operation, per-role policies. Name migrations `YYYYMMDDHHmmss_short_description.sql` in `supabase/migrations/`.
- Gate new protected pages by adding their path to `PROTECTED_ROUTES` in `@src/middleware.ts` — auth is enforced there, not per-page.
- API routes (`src/pages/api/**`) must include their own `context.locals.user` auth check returning 401 JSON. Do not rely on `PROTECTED_ROUTES` middleware for API auth.

## Project structure

`src/pages/` (routes; `api/` for endpoints), `src/components/` (`ui/` shadcn, `auth/` React forms), `src/lib/` (Supabase client, helpers; `services/` for business logic), `src/layouts/`, `src/middleware.ts`. Shared entities/DTOs go in `src/types.ts`.

## Commands

- `npm run dev` / `build` / `preview` — Astro on the Cloudflare workerd runtime.
- `npm run lint` / `lint:fix` — ESLint, type-checked rules.
- `npm run format` — Prettier (astro + tailwindcss plugins).

Husky + lint-staged auto-fix `*.{ts,tsx,astro}` on commit; don't bypass with `--no-verify`.

## Deployment

⚠️ **CRITICAL: Astro's Cloudflare adapter generates `dist/server/wrangler.json` at build time and wrangler uses THAT config, not the user's `wrangler.jsonc`. This means `wrangler deploy --env dev` is SILENTLY IGNORED and deploys to PRODUCTION. Always use `--name` to select the target worker.**

| Target                 | Command                                                        | URL                                               |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| **Dev** (safe preview) | `npm run build && npx wrangler deploy --name pomo-stretch-dev` | `https://pomo-stretch-dev.michal3run.workers.dev` |
| **Production**         | `npm run build && npx wrangler deploy`                         | `https://pomo-stretch.michal3run.workers.dev`     |

**First-time dev setup** (secrets — same Supabase project as prod):

```bash
npx wrangler secret put SUPABASE_URL --name pomo-stretch-dev
npx wrangler secret put SUPABASE_KEY --name pomo-stretch-dev
```

**Rules**:

- Always deploy to **dev first**, verify, then deploy to production.
- Never run bare `npx wrangler deploy` without explicit intent to update production.
- Never use `--env dev` — it is broken with the Astro Cloudflare adapter (see L13 in `lessons.md`).

## Conventions

- Astro components for static/layout; React only when interactivity is needed. No `"use client"` directives. Extract hooks to `src/components/hooks/`.
- Merge classes with `cn()` from `@/lib/utils` — never concatenate class strings.
- Add shadcn/ui components via `npx shadcn@latest add <name>` (new-york variant, into `src/components/ui/`).
- API handlers export uppercase `GET` / `POST` and validate input with zod.
- Import via the `@/*` → `./src/*` alias.
- All API endpoints must use `context.locals.supabase` (set by middleware), never call `createClient()` directly. The only exception is auth endpoints (`auth/signin`, `auth/signup`) which may need a client before middleware runs.
- **GitHub Operations**: Do NOT use or require `gh` (GitHub CLI). Use standard `git` for repository operations and GitHub REST API (`curl -X POST https://api.github.com/repos/...` with `Authorization: Bearer <token>`) for creating issues, milestones, or PRs. If a task or skill asks for `gh`, automatically translate it to `curl` or `web_fetch`.

## Commits & CI

Commit messages use a `type:` prefix (`docs:`, `feat:`, or a lesson id like `m1l3:`). CI (`@.github/workflows/ci.yml`) runs lint + build on every push/PR to `master` and requires the `SUPABASE_URL` / `SUPABASE_KEY` repo secrets.

> Course rules are managed below the separator by `10x get mNlN --tool generic`.
> Do not manually edit content below the separator line.

---

<!-- BEGIN @przeprogramowani/10x-cli -->

## 10xDevs AI Toolkit - Module 2, Lesson 4

Prepare for a harder implementation stream with the **research-backed planning chain**:

```
internal research (/10x-research) + external research (exa.ai, Context7) -> /10x-plan -> /10x-implement -> success
```

The lesson focus is distinguishing internal from external research and using evidence to back planning decisions.

### Task Router - Where to start

| Skill                                                            | Use it when                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Internal research (lesson focus)**                             |                                                                                                                                                                                                                                                |
| `/10x-research <change-id>`                                      | You need evidence from the existing codebase — patterns, conventions, integration points, or existing implementations. Runs parallel sub-agents over the repo and writes structured findings to `research.md`.                                 |
| **External research (lesson focus)**                             |                                                                                                                                                                                                                                                |
| exa.ai                                                           | You need AI-native web search for library comparisons, best practices, or ecosystem context that the codebase cannot answer.                                                                                                                   |
| Context7 (`resolve-library-id` → `get-library-docs`)             | You need live, current documentation for a specific library or framework. Resolves a library ID first, then fetches relevant doc pages.                                                                                                        |
| **Framing spare wheel**                                          |                                                                                                                                                                                                                                                |
| `/10x-frame <change-id>`                                         | The plan won't converge, the plan doesn't deliver expected results, or persistent drift keeps breaking the implementation. Use as an escape hatch on a separate problem (demonstrated on Space Explorers example), not as pre-research ritual. |
| **Planning and execution**                                       |                                                                                                                                                                                                                                                |
| `/10x-plan <change-id>` / `/10x-implement <change-id> phase <n>` | Use the same planning and execution chain from Lesson 2, now with upstream research evidence feeding the plan.                                                                                                                                 |

### Research discipline

- Internal research (`/10x-research`) answers "what does our codebase already do?" — patterns, schemas, conventions, integration points.
- External research (exa.ai, Context7) answers "what should we do?" — library capabilities, API docs, ecosystem best practices.
- Combine both as evidence-backed input to `/10x-plan`. A plan without research evidence on a non-trivial stream is a guess.
- Agent-friendly docs (`llms.txt`, markdown-for-agents, `/md` endpoints) are a quality signal for library selection — libraries that publish agent-readable docs integrate faster.

### `/10x-frame` as spare wheel

Three triggers for reaching for `/10x-frame`:

1. The plan won't converge — research keeps opening more questions instead of narrowing to a contract.
2. The plan doesn't deliver — implementation repeatedly fails to meet success criteria.
3. Persistent drift — the implementation keeps diverging from the plan in ways that suggest the problem was mis-framed.

Demonstrated on a Space Explorers example, not the SRS path. It is an escape hatch, not a mandatory step.

### Paths used by this lesson

- `context/changes/<change-id>/research.md` - internal research output
- `context/changes/<change-id>/frame.md` - framing output when needed
- `context/changes/<change-id>/plan.md` - evidence-backed implementation contract
- `context/foundation/lessons.md` - recurring rules and pitfalls

Skills must not write to `context/archive/`. Archived changes are immutable; if a resolved target path starts with `context/archive/`, abort with: "This change is archived. Open a new change with `/10x-new` instead."

<!-- END @przeprogramowani/10x-cli -->
