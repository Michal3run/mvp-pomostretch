---
project: pomo-stretch
researched_at: 2026-06-09
recommended_platform: Cloudflare Workers
runner_up: Vercel
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Astro 6 (SSR) + React 19 islands
  runtime: Cloudflare workerd (edge)
---

## Recommendation

**Deploy on Cloudflare Workers.**

The repo is already scaffolded for it — `@astrojs/cloudflare` adapter, `wrangler.jsonc` with the Workers server entrypoint + static-assets binding, and `output: "server"` SSR. Cloudflare wins on the two heaviest agent-friendly criteria (CLI-first via `wrangler`, fully managed edge runtime), its free tier (100k requests/day, scale-to-zero) comfortably covers single-user MVP scale, and global edge distribution supports the < 1.5 s break-content guardrail (NFR-1). Switching platforms now would mean swapping the adapter and discarding working config for no MVP-stage benefit.

> **Note on Pages vs Workers.** `tech-stack.md` records `deployment_target: cloudflare-pages`, but Cloudflare deprecated Pages for new projects (April 2025) and now directs all new builds to Workers (static assets + SSR in one Worker). The scaffold already targets **Workers** (the `wrangler.jsonc` `main` entrypoint + `assets` binding is Workers config, not Pages). This document supersedes the `cloudflare-pages` label — the correct, non-deprecated target is **Workers**.

## Platform Comparison

Hard filter applied: Q1 = "No persistent connections" (`has_realtime: false`, `has_background_jobs: false`) → no platform dropped on the persistent-process filter. Tech stack is JS/TS on an edge-compatible runtime → all six candidates technically viable.

| Platform | CLI-first | Managed/Serverless | Agent-readable docs | Stable deploy API | MCP / Integration | Total |
|---|---|---|---|---|---|---|
| **Cloudflare Workers** | Pass | Pass | Pass | Pass | Pass | **5 Pass** |
| Vercel | Pass | Pass | Pass | Pass | Partial (MCP beta) | 4P / 1Partial |
| Netlify | Pass | Pass | Pass | Pass | Pass | 5 Pass |
| Fly.io | Pass | Partial (managed VMs) | Pass | Pass | Fail (no MCP) | 3P / 1Pt / 1F |
| Railway | Pass | Pass | Partial | Pass | Fail | 3P / 1Pt / 1F |
| Render | Partial (hooks+API) | Pass | Partial | Pass | Fail | 3P / 2Pt |

### Shortlisted Platforms

#### 1. Cloudflare Workers (Recommended)

Five passes. `wrangler` covers the full operational loop (`deploy`, `versions`, `secret`, `tail`) from the terminal — an agent never needs the dashboard for routine ops. Docs publish `llms.txt` + markdown source on GitHub (criterion 3, strongest in the pool). Edge-native (criterion for Q4 global). MCP servers exist for docs/Workers/observability. Already wired in the repo. Tie-breaker over Netlify: existing familiarity + repo already configured (Q3), and edge-first matches the global-latency goal better than Netlify's function model.

#### 2. Vercel

Equally strong CLI + managed + docs story and excellent Astro support. Loses on cost sensitivity (function pricing escalates faster than Workers' free tier) and its MCP is OAuth-backed but beta as of 2026. Best fallback if Cloudflare's `nodejs_compat` limits block a needed dependency.

#### 3. Netlify

Also scores 5/5 (official MCP server, solid CLI). Drops to third on weighting: not edge-native to the same degree for SSR latency (Q4), and the project carries zero existing Netlify config — swapping in would discard the working Cloudflare scaffold for no MVP gain.

## Anti-Bias Cross-Check: Cloudflare Workers

### Devil's Advocate — Weaknesses

1. **Pages→Workers deprecation churn.** Most online Astro+Cloudflare tutorials still describe the Pages flow (`wrangler pages deploy`, Pages Git integration). An agent pattern-matching on stale docs will generate Pages-era commands that don't apply to this Workers project — wrong dashboards, wrong CLI subcommands, wrong env-var UI.
2. **`nodejs_compat` is partial, not full Node.** The post-MVP LLM free-text extraction layer (`has_ai: true`) may pull an SDK that depends on Node APIs not polyfilled on `workerd`. This fails at the edge runtime, not at build time — so it surfaces only after deploy.
3. **Supabase is external, not co-located.** Every authed request hits Supabase from the edge. If the Supabase project region is far from the user, cross-origin round-trips can threaten the < 1.5 s NFR-1 budget — the edge speed advantage is partly negated by the data hop.
4. **10 ms CPU per invocation (free tier).** LLM calls are I/O (don't count against CPU), but heavy synchronous SSR + markdown rendering on a cold path could brush the limit and return errors under the free plan.
5. **Three secret locations.** `astro:env/server` schema + `wrangler secret` (production) + `.dev.vars` (local) — easy to set a secret in one place and have it silently missing in another, especially since the env schema marks them `optional: true`.

### Pre-Mortem — How This Could Fail

Six months in, the deploy "worked" but the app was quietly broken in production. The root cause traced back to today: the team trusted the `cloudflare-pages` label in `tech-stack.md` and the agent, fed stale tutorials, kept trying `wrangler pages deploy` against a Workers project — burning a day before someone noticed Pages was deprecated. Worse, the GitHub `ci.yml` triggered on `master` while the repo's default branch was `main`, so the lint+build gate never ran on a single PR — broken builds merged unnoticed for weeks. When the LLM extraction feature landed, its SDK assumed full Node and threw `unsupported` only at runtime on `workerd`, invisible in CI. Meanwhile `SUPABASE_KEY` was never set as a production Worker secret (only in `.dev.vars`), and because the env schema marked it `optional`, auth failed silently with empty sessions instead of a hard boot error. Every one of these was a today-knowable config mismatch, not a platform limitation.

### Unknown Unknowns

- **CI branch mismatch (live bug).** `.github/workflows/ci.yml` triggers on `master`; the repo's default branch is `main`. The CI gate currently never fires. Fix before relying on it.
- **Default Worker name (live bug).** `wrangler.jsonc` still says `"name": "10x-astro-starter"`, not `pomo-stretch`. A deploy now publishes a misnamed Worker.
- **`astro dev` already uses `workerd` (v13).** As of `@astrojs/cloudflare` v13 / Astro 6, the dev server runs on `workerd` — so `npm run dev` already gives Cloudflare runtime fidelity. A separate `wrangler dev` step is largely redundant; don't add it out of habit.
- **`compatibility_date` is pinned** (`2026-05-08`). Runtime behavior is frozen to that date; bumping it later can change `nodejs_compat` surface. Treat it as a deliberate version knob, not boilerplate.
- **Auto-deploy is not wired yet.** CI only lints + builds — nothing deploys. Production deploy is currently manual (`wrangler deploy`) until Workers Builds (Cloudflare's Git integration) is connected.

## Operational Story

- **Preview deploys**: Cloudflare Workers Builds creates a preview URL per non-production branch/PR once the GitHub repo is connected (Workers → Builds). Until that's connected, previews come from a manual `wrangler versions upload` (uploads a version with a preview URL without promoting it to production).
- **Secrets**: Production secrets via `wrangler secret put SUPABASE_URL` / `SUPABASE_KEY` (stored in Cloudflare, not the repo). Local dev reads `.dev.vars` (gitignored). CI build reads GitHub repo secrets. Never commit any of them. Rotate by re-running `wrangler secret put`.
- **Rollback**: `wrangler deployments list` then `wrangler rollback [version-id]` — near-instant, no rebuild. Caveat: rollback reverts code only; it does not undo any Supabase schema migration shipped alongside.
- **Approval**: A human approves production publish (promote a version to production / `wrangler deploy` to prod) and any Supabase secret rotation. An agent may run `wrangler tail`, `wrangler deployments list`, `npm run build`, and preview/version uploads unattended (read-only or non-promoting).
- **Logs**: `wrangler tail` streams live runtime logs read-only; `observability.enabled: true` in `wrangler.jsonc` keeps logs queryable in the dashboard. Build logs surface in Workers Builds once connected.

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| CI triggers on `master`, default branch is `main` — gate never runs | Unknown unknowns | H | H | Change `on.push`/`on.pull_request` branches to `main` in `ci.yml`; verify a PR triggers the run |
| Worker deployed under default name `10x-astro-starter` | Unknown unknowns | H | M | Set `"name": "pomo-stretch"` in `wrangler.jsonc` before first deploy |
| Agent uses deprecated Pages commands (`wrangler pages deploy`) | Devil's advocate | M | M | Pin the AGENTS.md / plan to Workers commands (`wrangler deploy`, `versions`, `rollback`); ignore Pages-era tutorials |
| `SUPABASE_KEY` missing as prod Worker secret; fails silently (env `optional`) | Pre-mortem | M | H | Run `wrangler secret put` for both keys before first prod deploy; add a startup config check (`src/lib/config-status.ts` already exists) |
| LLM SDK breaks on `workerd` (`nodejs_compat` partial) | Devil's advocate | M | M | Validate any AI SDK against `workerd` locally before merging; prefer fetch-based LLM clients over Node-SDK wrappers |
| Supabase region far from users → NFR-1 < 1.5 s at risk | Devil's advocate | L | M | Pick a Supabase region near primary users; cache exercise catalog at edge; measure TTFB post-deploy |
| `compatibility_date` bump changes runtime behavior | Unknown unknowns | L | M | Treat date changes as deliberate; re-test after any bump |

## Getting Started

Validated against the pinned versions in this repo (`@astrojs/cloudflare` v13 / Astro 6 / `wrangler` v4), not generic platform docs:

1. **Fix the two config bugs first**: set `"name": "pomo-stretch"` in `wrangler.jsonc`; change CI branch triggers from `master` to `main` in `.github/workflows/ci.yml`.
2. **Authenticate wrangler**: `npx wrangler login` (opens browser once to link your Cloudflare account; the only manual GUI step).
3. **Set production secrets**: `npx wrangler secret put SUPABASE_URL` then `npx wrangler secret put SUPABASE_KEY`.
4. **Build + first manual deploy**: `npm run build` then `npx wrangler deploy`. (Local dev stays `npm run dev` — it already runs on `workerd`, no separate `wrangler dev` needed.)
5. **Wire auto-deploy** (covered by the deployment plan): connect the GitHub repo in Cloudflare → Workers → Builds so push-to-`main` deploys via Cloudflare's own Git integration, not an external CI/CD deploy step.

## Out of Scope

The following were not evaluated in this research:
- Docker image configuration
- CI/CD pipeline setup beyond platform-native auto-deploy
- Production-scale architecture (multi-region, HA, DR)
