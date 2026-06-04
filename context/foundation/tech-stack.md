---
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
---

## Why this stack

Solo developer shipping PomoStretch — a pomodoro work-cycle with pain-aware micro-breaks — in 3 weeks of after-hours work, with auth, a tagged exercise catalog, and (post-MVP) an LLM-driven free-text extraction layer. The recommended default for `(web, js)` is an opinionated full-stack starter that ships UI islands, API routes, auth, database, and edge deploy from a single repository, eliminating the multi-repo / multi-deploy zero-to-one cost that an alternative `.NET` backend plus a separate React frontend would have introduced. All four agent-friendly quality gates pass (typed, convention-based, popular in training, well-documented); bootstrapper confidence is first-class. Cloudflare Pages is selected as the starter's default deployment target — its generous free tier covers single-user MVP scale, and edge-runtime distribution comfortably supports the < 1.5s break-content guardrail (NFR-1) at global latency. CI is GitHub Actions with auto-deploy-on-merge to `main` — the standard solo shape on a stack the bootstrapper expects. Auth and AI feature flags are set; payments, realtime, and background-jobs flags are off per PRD non-goals.
