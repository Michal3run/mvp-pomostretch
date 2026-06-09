# Deployment Plan — PomoStretch on Cloudflare Workers

> **Mode:** Plan only. Nothing here has been executed. Each phase is gated on your approval; irreversible / account-touching actions are flagged 🔴 and require a human (you) to run or confirm them. Source decision: `@context/foundation/infrastructure.md`. Stack: `@context/foundation/tech-stack.md`.

**Target:** Cloudflare Workers (not Pages — Pages is deprecated for new projects as of April 2025).
**Auto-deploy model:** Cloudflare **Workers Builds** (platform-native Git integration). **No external CI/CD deploy step** — GitHub Actions stays lint+build only.
**Tooling:** `wrangler` v4 (already a devDependency), `@astrojs/cloudflare` v13, Astro 6.

---

## Phase 0 — Pre-flight fixes (blockers, do before anything else)

These are live config bugs found during infra research. Both must be fixed before the first deploy or it will misbehave.

- [x] **0.1 Rename the Worker.** `wrangler.jsonc` → change `"name": "10x-astro-starter"` to `"name": "pomo-stretch"`. Without this, the deploy publishes a misnamed Worker that's awkward to rename later (it becomes the production URL subdomain). ✅ applied 2026-06-09
- [x] **0.2 Fix CI branch triggers.** `.github/workflows/ci.yml` triggers on `master`, but the repo's default branch is `main`. Change both `on.push.branches` and `on.pull_request.branches` from `[master]` to `[main]`. Until fixed, the lint+build gate never runs. ✅ applied 2026-06-09
- [x] **0.3 Verify the build works locally.** Run `npm run build` once to confirm a clean production build before involving the platform. (Local, reversible, safe to run now.) ✅ green 2026-06-09 (sitemap `site` warning is expected — no custom domain yet)

**Approval gate:** confirm 0.1–0.3 applied and `npm run build` is green before Phase 1. ✅ Phase 0 complete.

---

## Phase 1 — Cloudflare account + wrangler CLI prerequisites

How to configure the CLI for Cloudflare (prompt m1l5-3). All commands use `npx` so no global install is needed.

- [x] **1.1 Confirm a Cloudflare account exists.** Free tier is sufficient (100k requests/day, scale-to-zero). If you don't have one, create it at dash.cloudflare.com (free, no card required for Workers free tier). 🔴 *manual, account-side* ✅ account: michal3run
- [x] **1.2 Authenticate wrangler.** `npx wrangler login` — opens the browser once to link your account and grant the CLI an API token. This is the **only** required GUI step. 🔴 *interactive, opens browser* ✅
- [x] **1.3 Verify auth.** `npx wrangler whoami` — should print your account email + account ID. Read-only check. ✅
- [ ] **1.4 (Optional) Confirm no name collision.** `npx wrangler deployments list` against the `pomo-stretch` name will error if the Worker doesn't exist yet — that's expected on first run and confirms the name is free.

**Notes for an unfamiliar user:**
- `wrangler` = Cloudflare's CLI. It deploys, streams logs, manages secrets, and rolls back — all from the terminal.
- `npx wrangler <cmd>` runs the version pinned in this repo; you never need a separate global install.
- Local dev stays `npm run dev` — as of `@astrojs/cloudflare` v13 it already runs on the `workerd` runtime, so it faithfully mimics production. **Do not** add a separate `wrangler dev` step; it's redundant here.

**Approval gate:** confirm `wrangler whoami` succeeds before Phase 2.

---

## Phase 2 — Production secrets

The app reads `SUPABASE_URL` / `SUPABASE_KEY` via `astro:env/server`. The env schema marks them `optional: true`, so a missing secret fails **silently** (empty auth sessions, not a crash) — set them deliberately.

- [x] **2.1 Set the Supabase URL secret.** `npx wrangler secret put SUPABASE_URL` → paste the value when prompted. 🔴 *writes a production secret to Cloudflare* ✅
- [x] **2.2 Set the Supabase key secret.** `npx wrangler secret put SUPABASE_KEY` → paste the value. 🔴 ✅
- [x] **2.3 Verify.** `npx wrangler secret list` — should list both names (values are never shown). ✅
- [x] **2.4 Decide Supabase region.** Pick (or confirm) a Supabase project region near your primary users to protect the < 1.5 s break-content budget (NFR-1). 🔴 *account-side decision* ✅ cloud Supabase project created

**Secret hygiene:** never paste secret values into chat or commit them. `.dev.vars` (local) is gitignored; production values live only in Cloudflare; CI build values live in GitHub repo secrets. Three locations — set each intentionally.

**Approval gate:** both secrets listed before Phase 3.

---

## Phase 3 — First manual deploy (smoke test)

Deploy once by hand to confirm the whole chain works before automating it.

- [x] **3.1 Build.** `npm run build` — produces `./dist` (the `assets` binding directory in `wrangler.jsonc`). ✅ (note: on Node 26 the build emits a harmless libuv `async.c` assertion on process exit — `dist/` is produced correctly; repo pins Node 22 in `.nvmrc`)
- [x] **3.2 Deploy.** `npx wrangler deploy` — uploads the Worker + static assets, returns a `*.workers.dev` production URL. 🔴 *publishes to production — first irreversible-ish action; revertible via rollback* ✅ **Live: https://pomo-stretch.michal3run.workers.dev** (Version ID `7c8b10d0-2859-4b5a-9d47-32edb95af33e`, startup 26 ms)
- [x] **3.3 Smoke test the live URL.** Load the home page, `/auth/signin`, and a protected route (`/dashboard` should redirect when unauthenticated). Confirm auth round-trips to Supabase. ✅ home + signin `200`; `/dashboard` redirects when unauthenticated; signup→signin→dashboard verified end-to-end against Supabase
- [ ] **3.4 Check logs.** `npx wrangler tail` — stream live runtime logs; confirm no `nodejs_compat` / runtime errors. Watch especially for any Node-API errors (relevant once the post-MVP LLM layer lands).

**Deviation from plan (recorded):** `wrangler deploy` auto-provisioned a KV namespace `pomo-stretch-session` for the `SESSION` binding (Astro Sessions). This was not a planned step — Cloudflare created it on first deploy and persists its ID server-side, so future deploys keep working without committing the ID. The starter also exposes `IMAGES` (Cloudflare Images) and `ASSETS` bindings. No secret or resource ID was written into the committed `wrangler.jsonc` (wrangler reformatted it to tabs only; reverted).

**Rollback if needed:** `npx wrangler deployments list` then `npx wrangler rollback [version-id]` — near-instant, code-only (does not undo Supabase migrations).

**Approval gate:** live URL serves all routes correctly before Phase 4.

---

## Phase 4 — Platform-native auto-deploy on `main` (Workers Builds)

Auto-deploy on the main branch handled by **Cloudflare Workers Builds**, not an external CI/CD system (prompt m1l5-2). The GitHub Actions workflow stays a quality gate (lint + build); it does **not** call `wrangler deploy`.

- [x] **4.1 Connect the repo.** Cloudflare dashboard → Workers & Pages → the `pomo-stretch` Worker → **Builds** → Connect GitHub → select `Michal3run/mvp-pomostretch`. 🔴 *grants Cloudflare read access to the repo* ✅
- [x] **4.2 Configure the build.** Production branch = `main`; build command = `npm run build`; deploy command = `npx wrangler deploy` (Cloudflare runs it on its side); output handled by the adapter. ✅
- [x] **4.3 Set build-time vars on Cloudflare's side** if the build needs them (the Worker runtime secrets from Phase 2 are separate from build-time vars). For this app the build doesn't require Supabase creds, but confirm the build is green in the Cloudflare Builds log. ✅ build does not require Supabase creds
- [x] **4.4 Verify the loop.** Push a trivial commit to `main` → confirm Cloudflare Builds triggers, builds, and deploys automatically; confirm GitHub Actions runs lint+build in parallel **without** deploying. ✅ verified via the docs-only commit that recorded this very line
- [ ] **4.5 Preview deploys (optional).** Enable non-production branch builds in Workers Builds for per-PR preview URLs.

**Division of labor (important):**
- **GitHub Actions** (`ci.yml`): lint + build on every push/PR to `main`. Quality gate. Never deploys.
- **Cloudflare Workers Builds**: builds + deploys on push to `main`. The only thing that publishes to production.

This keeps the deploy trigger inside the platform that owns the runtime — no Cloudflare API token stored in GitHub, smaller blast radius.

**Approval gate:** confirm one real push to `main` auto-deploys via Cloudflare before considering the lesson done.

---

## Edge cases & extra support

- **Deprecated Pages commands.** Ignore any tutorial using `wrangler pages deploy` / Pages Git integration — this is a Workers project. The correct commands are `wrangler deploy`, `wrangler versions`, `wrangler rollback`, `wrangler tail`.
- **`nodejs_compat` is partial.** Before merging the post-MVP LLM extraction feature, test its SDK locally on `workerd` (`npm run dev`). Prefer fetch-based LLM clients over Node-SDK wrappers; Node-only APIs fail at runtime, not at build.
- **`compatibility_date` (`2026-05-08`)** is a deliberate version knob. Bumping it can change the `nodejs_compat` surface — re-test after any change.
- **Silent secret failure.** Because the env schema is `optional: true`, missing prod secrets produce empty sessions, not errors. `src/lib/config-status.ts` already exists — consider surfacing a visible config check on boot.

## Out of scope (per infrastructure.md)

- Dockerfiles, custom domains/DNS, multi-region/HA/DR, medium-term cost projections beyond free-tier headroom.

---

## Execution status

**Complete.** All phases executed 2026-06-09. Production is live at https://pomo-stretch.michal3run.workers.dev with auth verified end-to-end. Auto-deploy on `main` is handled by Cloudflare Workers Builds; GitHub Actions remains lint+build only. Remaining optional item: 4.5 (per-PR preview deploys).
