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

## 10xDevs AI Toolkit - Module 3, Lesson 4 (E2E Tests)

**For E2E tests, use the `/10x-e2e` skill.** It is the single source of truth
for the workflow — risk → seed test + rules → generate → review against the five
anti-patterns → re-prompt → verify. The skill's `references/` carry the full
rules, anti-patterns, seed pattern, and prompt-template.

A few hard rules that hold even before you invoke the skill:

- **Locators:** `getByRole` / `getByLabel` / `getByText` first; `getByTestId`
  only when accessibility attributes are ambiguous. Never CSS selectors, XPath,
  or DOM structure.
- **Never `page.waitForTimeout()`.** Wait for state: `toBeVisible()`,
  `waitForURL()`, `waitForResponse()`.
- **Test independence + cleanup.** Each test runs standalone — its own setup,
  action, assertion, and cleanup; unique ids (timestamp suffix) so parallel runs
  and re-runs don't collide.

Two boundaries to keep straight:

- **DOM (snapshot) is the default.** Vision (`--caps=vision`) is a supplement for
  visual-only risks (layout, z-index, animation); for pixel regression prefer
  deterministic tools (`toMatchSnapshot`, Argos, Lost Pixel). VLM model
  selection/cost is a debugging topic (Lesson 5), not testing.
- **Healer helps on selectors, harms on logic.** A changed selector → healer
  re-finds it (route through PR review). A changed business behavior → healer
  masks the bug; that failing-test-to-fix case is Lesson 5.

<!-- END @przeprogramowani/10x-cli -->
