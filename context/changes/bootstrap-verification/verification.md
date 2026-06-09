---
bootstrapped_at: 2026-06-05T20:54:34Z
starter_id: 10x-astro-starter
starter_name: 10x Astro Starter (Astro + Supabase + Cloudflare)
project_name: pomo-stretch
language_family: js
package_manager: npm
cwd_strategy: git-clone
bootstrapper_confidence: first-class
phase_3_status: ok
audit_command: npm audit --json
---

## Hand-off

Copied verbatim from `context/foundation/tech-stack.md`.

```yaml
starter_id: 10x-astro-starter
package_manager: npm
project_name: pomo-stretch
hints:
  language_family: js
  team_size: solo
  deployment_target: cloudflare-pages
  ci_provider: github-actions
  ci_default_flow: auto-deploy-on-merge
  bootstrapper_confidence: first-class
  path_taken: standard
  quality_override: false
  self_check_answers: null
  has_auth: true
  has_payments: false
  has_realtime: false
  has_ai: true
  has_background_jobs: false
```

### Why this stack

Solo developer shipping PomoStretch — a pomodoro work-cycle with pain-aware micro-breaks — in 3 weeks of after-hours work, with auth, a tagged exercise catalog, and (post-MVP) an LLM-driven free-text extraction layer. The recommended default for `(web, js)` is an opinionated full-stack starter that ships UI islands, API routes, auth, database, and edge deploy from a single repository, eliminating the multi-repo / multi-deploy zero-to-one cost that an alternative `.NET` backend plus a separate React frontend would have introduced. All four agent-friendly quality gates pass (typed, convention-based, popular in training, well-documented); bootstrapper confidence is first-class. Cloudflare Pages is selected as the starter's default deployment target — its generous free tier covers single-user MVP scale, and edge-runtime distribution comfortably supports the < 1.5s break-content guardrail (NFR-1) at global latency. CI is GitHub Actions with auto-deploy-on-merge to `main` — the standard solo shape on a stack the bootstrapper expects. Auth and AI feature flags are set; payments, realtime, and background-jobs flags are off per PRD non-goals.

## Pre-scaffold verification

| Signal      | Value                                                          | Severity | Notes                                                                                   |
| ----------- | -------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------- |
| npm package | not run                                                        | n/a      | `cmd_template` starts with `git clone` — no npm-published CLI to query                  |
| GitHub repo | przeprogramowani/10x-astro-starter last pushed 2026-05-17      | fresh    | from `card.docs_url`; queried via GitHub REST API (gh CLI unavailable, used Invoke-RestMethod fallback) |

## Scaffold log

**Resolved invocation**: `git clone https://github.com/przeprogramowani/10x-astro-starter .bootstrap-scaffold && cd .bootstrap-scaffold && npm install`
**Strategy**: git-clone
**Exit code**: 0 (git clone: 0; npm install: 0)
**Files moved**: 19 top-level entries (7 directories + 12 files)
**Conflicts (`.scaffold` siblings)**: none
**`.gitignore` handling**: append-merged — cwd lines kept in order, scaffold lines appended after a `# from 10x-astro-starter` separator with non-blank/non-comment content lines de-duped against the cwd set
**`.bootstrap-scaffold/.git/` removed before move-up**: yes
**`.bootstrap-scaffold` cleanup**: deleted (no leftover paths)

### Move-up detail

Directories moved: `.github`, `.husky`, `.vscode`, `node_modules`, `public`, `src`, `supabase`.
Files moved: `.env.example`, `.nvmrc`, `.prettierrc.json`, `astro.config.mjs`, `CLAUDE.md`, `components.json`, `eslint.config.js`, `package-lock.json`, `package.json`, `README.md`, `tsconfig.json`, `wrangler.jsonc`.
File handled separately by append-merge: `.gitignore`.
Files preserved in cwd untouched: `AGENTS.md`, `KIRO.md`, `.git/`, `.ai/`, `context/`.

## Post-scaffold audit

**Tool**: `npm audit --json`
**Exit code**: 1 (informational — npm exits non-zero whenever advisories exist; not treated as a halt)
**Summary**: 0 CRITICAL, 1 HIGH, 9 MODERATE, 0 LOW (total 10)
**Direct vs transitive**: 0/0/2/0 direct of total 0/1/9/0 (per `isDirect` on each advisory)

#### CRITICAL findings

None.

#### HIGH findings

- **devalue** v5.6.3–5.8.0 — `GHSA-77vg-94rm-hx3p` — Svelte devalue: DoS via sparse array deserialization (CVSS 7.5, CWE-770). Transitive (pulled in via `wrangler` → `miniflare` chain). Fix available via `npm audit fix`.

#### MODERATE findings

- **@astrojs/check** ≥ 0.9.3 — moderate via `@astrojs/language-server`. **Direct** dependency. Fix available; semver-major to 0.9.2 (note: registry advisory hints fix at 0.9.2 because newer versions re-introduced the chain — verify before applying).
- **wrangler** v3.108.0–4.93.0 (and `<=0.0.0-kickoff-demo`) — moderate via `miniflare`. **Direct** dependency. Fix available.
- **@astrojs/language-server** ≥ 2.14.0 — moderate via `volar-service-yaml`. Transitive. Fix advised through `@astrojs/check` major bump.
- **@cloudflare/vite-plugin** ≤ 0.0.0-fff677e35 || 0.0.7–1.37.2 — moderate via `miniflare`, `wrangler`, `ws`. Transitive. Fix available.
- **miniflare** ≤ 0.0.0-fff677e35 || 3.20250204.0–4.20260518.0 — moderate via `ws`. Transitive. Fix available.
- **volar-service-yaml** ≤ 0.0.70 — moderate via `yaml-language-server`. Transitive. Fix advised through `@astrojs/check` major bump.
- **ws** v8.0.0–8.20.0 — `GHSA-58qx-3vcg-4xpx` — Uninitialized memory disclosure (CVSS 4.4, CWE-908). Transitive. Fix available.
- **yaml** v2.0.0–2.8.2 — `GHSA-48c2-rrv3-qjmp` — Stack Overflow via deeply nested YAML collections (CVSS 4.3, CWE-674). Transitive. Fix advised through `@astrojs/check` major bump.
- **yaml-language-server** v1.11.1-08d5f7b.0–1.21.1-f1f5a94.0 || 1.22.1-0ae5603.0–1.22.1-fc5f874.0 — moderate via `yaml`. Transitive. Fix advised through `@astrojs/check` major bump.

#### LOW / INFO findings

None.

### Direct vs transitive context

Most findings are transitive — pulled in by upstream packages (`wrangler`, `miniflare`, `@astrojs/check`, `volar-service-yaml`). Only two direct findings (`@astrojs/check`, `wrangler`), both moderate. The single HIGH (`devalue`) is transitive and resolves cleanly with `npm audit fix`. Bootstrapper informs; no action taken on findings (per the WARN-AND-CONTINUE policy).

## Hints recorded but not acted on

| Hint                       | Value                  |
| -------------------------- | ---------------------- |
| bootstrapper_confidence    | first-class            |
| quality_override           | false                  |
| path_taken                 | standard               |
| self_check_answers         | null                   |
| team_size                  | solo                   |
| deployment_target          | cloudflare-pages       |
| ci_provider                | github-actions         |
| ci_default_flow            | auto-deploy-on-merge   |
| has_auth                   | true                   |
| has_payments               | false                  |
| has_realtime               | false                  |
| has_ai                     | true                   |
| has_background_jobs        | false                  |

These fields were read into bootstrapper's working memory and copied here for audit-trail completeness. v1 surfaces but does not act on them; a future M1L4 ("Memory Architecture") skill is expected to consume them when generating agent context.

## Next steps

Next: a future skill will set up agent context (CLAUDE.md, AGENTS.md). For now, your project is scaffolded and verified — happy hacking.

Useful manual steps in the meantime:
- `git init` (if you have not already) to start your own repo history.
- Review any `.scaffold` siblings the conflict policy created and decide which version of each file to keep. (This run: none created.)
- Address audit findings per your project's risk tolerance — the full breakdown is above. Quick path: `npm audit fix` resolves the HIGH (`devalue`) and most MODERATEs without breaking changes; the `@astrojs/check` major bump suggested for the YAML toolchain chain is `--force` territory and worth eyeballing first.
- The starter ships its own `CLAUDE.md` at the project root. Your existing `AGENTS.md` was preserved untouched; reconcile the two when the M1L4 skill ships (or sooner, if you prefer).
