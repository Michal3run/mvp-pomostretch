# create-roadmap-issues.ps1
# Creates GitHub Milestone "MVP v1" + Issues M0-M6 from roadmap.md
# Uses GitHub REST API via Invoke-RestMethod (no gh CLI needed)
#
# Usage:
#   $env:GITHUB_TOKEN = "ghp_YourToken"
#   powershell -ExecutionPolicy Bypass -File .\create-roadmap-issues.ps1

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

if (-not $env:GITHUB_TOKEN) {
    Write-Host "`n[ERROR] GITHUB_TOKEN not set!" -ForegroundColor Red
    Write-Host 'Set it: $env:GITHUB_TOKEN = "ghp_YourToken"' -ForegroundColor Yellow
    exit 1
}

$script:headers = @{
    "Authorization"        = "Bearer $($env:GITHUB_TOKEN)"
    "Accept"               = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$script:baseUrl = "https://api.github.com/repos/Michal3run/mvp-pomostretch"

function Send-GitHubApi {
    param([string]$Endpoint, [string]$Method = "Get", [string]$JsonBody)
    $uri = "$($script:baseUrl)$Endpoint"
    $params = @{ Uri = $uri; Headers = $script:headers; Method = $Method; ContentType = "application/json; charset=utf-8" }
    if ($JsonBody) {
        $params.Body = [System.Text.Encoding]::UTF8.GetBytes($JsonBody)
    }
    return Invoke-RestMethod @params
}

function Ensure-Label([string]$Name, [string]$Color, [string]$Desc) {
    try {
        $null = Send-GitHubApi -Endpoint "/labels/$Name"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "  Creating label: $Name" -ForegroundColor DarkGray
            $json = @{ name = $Name; color = $Color; description = $Desc } | ConvertTo-Json
            $null = Send-GitHubApi -Endpoint "/labels" -Method Post -JsonBody $json
        } else { throw }
    }
}

function New-GHIssue([string]$Title, [string]$Body, [string[]]$Labels, [int]$Milestone) {
    Write-Host "Creating: $Title ..." -NoNewline
    $obj = @{ title = $Title; body = $Body; labels = $Labels; milestone = $Milestone }
    $json = $obj | ConvertTo-Json -Depth 5
    $result = Send-GitHubApi -Endpoint "/issues" -Method Post -JsonBody $json
    Write-Host " OK (#$($result.number))" -ForegroundColor Green
    return $result
}

function Update-GHIssueBody([int]$Num, [string]$Body) {
    $json = @{ body = $Body } | ConvertTo-Json -Depth 5
    $null = Send-GitHubApi -Endpoint "/issues/$Num" -Method Patch -JsonBody $json
}

# === Step 1: Labels ===
Write-Host "`n=== Creating labels ===" -ForegroundColor Cyan
$labelDefs = @(
    ,@("mvp",           "0e8a16", "MVP v1 milestone")
    ,@("foundation",    "1d76db", "Foundation work")
    ,@("complete",      "2ea44f", "Already completed")
    ,@("horizontal",    "c5def5", "Bounded horizontal enabler")
    ,@("database",      "006b75", "Database/schema work")
    ,@("feature",       "a2eeef", "Product feature")
    ,@("vertical",      "d4c5f9", "Vertical slice")
    ,@("ui",            "f9d0c4", "UI/frontend work")
    ,@("core",          "e4e669", "Core business logic")
    ,@("certification", "fbca04", "Certification requirement")
    ,@("testing",       "bfd4f2", "Testing work")
    ,@("cross-cutting", "d93f0b", "Cross-cutting concern")
)
foreach ($l in $labelDefs) { Ensure-Label -Name $l[0] -Color $l[1] -Desc $l[2] }
Write-Host "Labels OK" -ForegroundColor Green

# === Step 2: Milestone ===
Write-Host "`n=== Milestone 'MVP v1' ===" -ForegroundColor Cyan
$milestones = Send-GitHubApi -Endpoint "/milestones?state=all"
$ms = $milestones | Where-Object { $_.title -eq "MVP v1" }
if (-not $ms) {
    Write-Host "Creating milestone..." -ForegroundColor Yellow
    $msJson = @{ title = "MVP v1"; description = "First certifiable MVP - US-01 end-to-end"; due_on = "2026-07-31T23:59:59Z" } | ConvertTo-Json
    $ms = Send-GitHubApi -Endpoint "/milestones" -Method Post -JsonBody $msJson
    Write-Host "Created MVP v1 (#$($ms.number))" -ForegroundColor Green
} else {
    Write-Host "Found MVP v1 (#$($ms.number))" -ForegroundColor Green
}
$msNum = $ms.number

# === Step 3: Issues ===
Write-Host "`n=== Creating Issues M0-M6 ===" -ForegroundColor Cyan

# --- M0 ---
$b = @(
    "## Outcome"
    "Auth foundation (90% complete): sign-up/sign-in/sign-out forms, API endpoints, middleware gating, Supabase client wired, user session available via ``Astro.locals.user``."
    ""
    "## PRD References"
    "FR-001 through FR-004"
    ""
    "## Dependencies"
    "**Depends on**: None (Baseline state)"
    "**Blocks**: M1, M2, M5"
    ""
    "## Acceptance Criteria"
    "- [x] User can register, sign in, sign out (FR-001 through FR-003)"
    "- [x] Unauthenticated user redirected to sign-in (FR-004)"
    "- [x] Production deployment live at https://pomo-stretch.michal3run.workers.dev"
    "- [x] Supabase project configured, ``auth.users`` table operational"
    ""
    "## Risks"
    "None (Already completed during bootstrap phase)"
    ""
    "## Estimated Effort"
    "Complete"
    ""
    "---"
    "Full spec: ``context/foundation/roadmap.md`` section ``## Baseline State``"
) -join "`n"

$m0 = New-GHIssue -Title "M0: Auth Foundation" -Body $b -Labels @("foundation","complete") -Milestone $msNum

Write-Host "Closing M0 (#$($m0.number))..." -NoNewline
$null = Send-GitHubApi -Endpoint "/issues/$($m0.number)" -Method Patch -JsonBody '{"state":"closed"}'
Write-Host " OK" -ForegroundColor Green

# --- M1 ---
$b = @(
    "## Outcome"
    "Two Supabase migrations written and applied to local dev + staging:"
    "1. ``exercise`` table with 12-15 seed rows covering 4 body-areas (eyes, neck, shoulders, lower-back)"
    "2. ``break_session`` table with RLS policies enforcing user ownership"
    ""
    "No API endpoints, no UI -- this milestone is schema + seed only."
    ""
    "## PRD References"
    "FR-020 through FR-022"
    ""
    "## Dependencies"
    "**Depends on**: #$($m0.number) (M0: Auth Foundation)"
    "**Blocks**: _TBD (M4 + M5 links added after creation)_"
    ""
    "## Acceptance Criteria"
    "- [ ] ``supabase/migrations/<timestamp>_create_exercise_table.sql`` exists and applies cleanly"
    "- [ ] ``supabase/migrations/<timestamp>_create_break_session_table.sql`` exists and applies cleanly"
    "- [ ] ``SELECT COUNT(*) FROM exercise`` returns >= 12 rows"
    "- [ ] Every quick-pick mapping matches >= 2 exercises in the seed data (validates FR-022)"
    "- [ ] ``break_session`` has RLS enabled with 4 policies: SELECT, INSERT, UPDATE, DELETE gated by ``user_id = auth.uid()``"
    "- [ ] Local ``supabase start`` can query both tables"
    "- [ ] Staging Supabase project has both migrations applied"
    ""
    "## Risks"
    "| Risk | Mitigation |"
    "|---|---|"
    "| Exercise descriptions low-quality / copyright issue | Write original descriptions (50-200 chars). Allow 1.5-2h of budget. |"
    "| Seed data doesn't cover all 4 quick-picks (FR-022) | Write coverage validation query in migration comment. |"
    "| RLS policies misconfigured (R-02, R-05) | Test with two local users: user A inserts, user B selects, expect 0 rows. |"
    "| Migration file naming collision | Use YYYYMMDDHHmmss prefix. |"
    ""
    "## Estimated Effort"
    "3-4 hours"
    ""
    "---"
    "Full spec: ``context/foundation/roadmap.md`` section ``## M1: Database Schema & Exercise Catalog``"
) -join "`n"

$m1 = New-GHIssue -Title "M1: Database Schema & Exercise Catalog" -Body $b -Labels @("mvp","foundation","horizontal","database") -Milestone $msNum

# --- M2 ---
$b = @(
    "## Outcome"
    "Dashboard (``src/pages/dashboard.astro``) transforms from a placeholder into a functional pomodoro timer. Signed-in user can:"
    "- Start a 25-minute work session"
    "- See live countdown (MM:SS format, updates every second)"
    "- Extend session by +5 minutes (unlimited times)"
    "- Manually end session early via 'Zaczynaj przerwe' button"
    "- Experience auto-transition to break-input screen when countdown reaches 00:00"
    ""
    "Timer state persists in ``localStorage`` -- a page refresh during an active session restores the timer (NFR-2 / Guardrail G3)."
    ""
    "## PRD References"
    "FR-005 through FR-009, NFR-2 (timer durability)"
    ""
    "## Dependencies"
    "**Depends on**: #$($m0.number) (M0: Auth Foundation)"
    "**Blocks**: _TBD (M3 link added after creation)_"
    ""
    "## Acceptance Criteria"
    "- [ ] Dashboard shows 'Start work session' button when no active session"
    "- [ ] Clicking 'Start' creates a 25-min timer, button changes to countdown display"
    "- [ ] Countdown updates every second in MM:SS format"
    "- [ ] '+5 min' button visible during active session, extends remaining time by 300 seconds"
    "- [ ] 'Zaczynaj przerwe' button visible during active session, navigates to ``/break-input``"
    "- [ ] When countdown reaches 00:00, auto-navigate to ``/break-input``"
    "- [ ] ``localStorage.getItem('pomostretch.timer')`` contains ``{ startedAt, durationMs, extendedMs }`` during active session"
    "- [ ] Page refresh during active session restores timer at correct remaining time (+/- 2s tolerance)"
    "- [ ] Closing tab and reopening within ~30s restores timer (validates NFR-2)"
    "- [ ] Timer state clears from ``localStorage`` when session ends (manual or auto)"
    ""
    "## Risks"
    "| Risk | Mitigation |"
    "|---|---|"
    "| localStorage durability fails (private mode, quota exceeded) | Catch exceptions, fall back to in-memory state with warning toast. |"
    "| Countdown drift (interval accumulates ms) | Recalculate remaining from Date.now() on every tick. |"
    "| Tab in background, setInterval throttled | On visibilitychange event, recalculate remaining time immediately. |"
    "| Auto-transition races with manual navigation | Always clear interval + storage before any navigation. |"
    ""
    "## Estimated Effort"
    "4-5 hours"
    ""
    "---"
    "Full spec: ``context/foundation/roadmap.md`` section ``## M2: Pomodoro Timer``"
) -join "`n"

$m2 = New-GHIssue -Title "M2: Pomodoro Timer" -Body $b -Labels @("mvp","feature","vertical","ui") -Milestone $msNum

# --- M3 ---
$b = @(
    "## Outcome"
    "New page at ``src/pages/break-input.astro``. User lands here after ending a work session. Page offers:"
    "- 4 quick-pick buttons: 'Tylko oczy' / 'Tylko kark' / 'Ogolne' / 'Zaskocz mnie'"
    "- Free-text input field with placeholder 'Co Cie boli? (opcjonalne)'"
    "- 'Skip break' button (navigates back to dashboard)"
    ""
    "Submitting a quick-pick or free-text POSTs to ``/api/break-input``, stores input + derived tags in a server-side cookie (5-min TTL), then redirects to ``/exercise-sequence``."
    ""
    "## PRD References"
    "FR-010 through FR-013"
    ""
    "## Dependencies"
    "**Depends on**: #$($m2.number) (M2: Pomodoro Timer)"
    "**Blocks**: _TBD (M4 link added after creation)_"
    ""
    "## Acceptance Criteria"
    "- [ ] ``/break-input`` route exists and is gated (requires auth)"
    "- [ ] Page displays 4 quick-pick buttons with Polish labels"
    "- [ ] Page displays free-text textarea (optional)"
    "- [ ] Page displays 'Skip break' button"
    "- [ ] Clicking any quick-pick submits form via POST to ``/api/break-input``"
    "- [ ] Free-text submission POSTs to ``/api/break-input``"
    "- [ ] POST handler derives tags via keyword matcher, stores in signed cookie, redirects to ``/exercise-sequence``"
    "- [ ] Cookie has 5-min expiry"
    "- [ ] Empty free-text + no quick-pick shows validation message"
    "- [ ] Keyword matcher at ``src/lib/keyword-matcher.ts`` extracts body-area tags from Polish + English keywords"
    "- [ ] Free-text with no recognized keywords falls back to ``tags=general`` (FR-012)"
    "- [ ] 'Skip break' navigates to ``/dashboard``, clears timer state"
    ""
    "## Risks"
    "| Risk | Mitigation |"
    "|---|---|"
    "| Keyword list too narrow, many inputs fall back to general | Start with 5-7 keywords per body-area (PL+EN). |"
    "| Misspelled Polish (e.g. 'karek' vs 'kark'), no match | Substring match is forgiving. Post-MVP: fuzzy match. |"
    "| Free-text 10k chars DoS risk | Cap at 500 chars client + server side. |"
    "| Cookie manipulation | Use Astro signed cookie API (HMAC). Invalid signature redirects back. |"
    ""
    "## Estimated Effort"
    "3-4 hours"
    ""
    "---"
    "Full spec: ``context/foundation/roadmap.md`` section ``## M3: Break Input & Keyword Matching``"
) -join "`n"

$m3 = New-GHIssue -Title "M3: Break Input & Keyword Matching" -Body $b -Labels @("mvp","feature","vertical","ui") -Milestone $msNum

# Update M2 Blocks
Write-Host "  Updating M2 Blocks -> #$($m3.number)..." -NoNewline
$m2body = (Send-GitHubApi -Endpoint "/issues/$($m2.number)").body
$m2body = $m2body -replace '_TBD \(M3 link added after creation\)_', "#$($m3.number) (M3: Break Input & Keyword Matching)"
Update-GHIssueBody -Num $m2.number -Body $m2body
Write-Host " OK" -ForegroundColor DarkGray

# --- M4 ---
$b = @(
    "## Outcome"
    "New page at ``src/pages/exercise-sequence.astro``. Page reads the ``pomostretch.break_input`` cookie, runs the rule engine to select 1-3 exercises, displays them one at a time with:"
    "- Exercise name + description"
    "- Per-exercise countdown timer (30s-2min)"
    "- 'Done' button (marks complete, advances)"
    "- 'Skip' button (marks skipped, advances)"
    ""
    "After the last exercise, user sees 'Resume work?' prompt. This milestone completes US-01."
    ""
    "## PRD References"
    "FR-014 through FR-022, core business logic"
    ""
    "## Dependencies"
    "**Depends on**: #$($m1.number) (M1: Database Schema), #$($m3.number) (M3: Break Input)"
    "**Blocks**: US-01 completion, _TBD (M6 link added after creation)_"
    ""
    "## Acceptance Criteria"
    "- [ ] ``/exercise-sequence`` route exists and is gated"
    "- [ ] Page reads ``pomostretch.break_input`` cookie on SSR"
    "- [ ] If cookie missing/expired, redirect to ``/break-input``"
    "- [ ] Rule engine at ``src/lib/rule-engine.ts`` selects 1-3 exercises based on tags"
    "- [ ] Page displays first exercise with name, description, countdown"
    "- [ ] 'Done' button increments completed count, advances to next or end"
    "- [ ] 'Skip' button increments skipped count, advances to next or end"
    "- [ ] Countdown reaches zero, auto-advance (same as Done)"
    "- [ ] After last exercise: 'Resume work?' prompt with 'Tak' / 'Nie'"
    "- [ ] 'Tak' navigates to ``/dashboard``, starts new timer"
    "- [ ] 'Nie' navigates to ``/dashboard``, user is idle"
    "- [ ] Cookie cleared after sequence ends"
    "- [ ] No-repeat rule: ``localStorage.getItem('pomostretch.lastSession')`` excludes previous exercise IDs (FR-019)"
    "- [ ] All 4 quick-pick inputs produce >= 1 exercise (FR-022)"
    ""
    "## Risks"
    "| Risk | Mitigation |"
    "|---|---|"
    "| Rule engine returns 0 exercises (over-filtering) | Fallback to general tag. Unit test R-04. |"
    "| No-repeat logic fails, same exercise twice | Unit test with catalog of 3, last session had exercise A. |"
    "| Per-exercise countdown drifts/freezes | Date.now() recalc on every tick, handle visibilitychange. |"
    "| User refreshes mid-sequence, loses progress | Acceptable for MVP (2-5 min sequence). |"
    "| Catalog fetch fails (Supabase down) | Error page with retry button. |"
    ""
    "## Estimated Effort"
    "5-6 hours"
    ""
    "---"
    "Full spec: ``context/foundation/roadmap.md`` section ``## M4: Exercise Selection & Sequence``"
) -join "`n"

$m4 = New-GHIssue -Title "M4: Exercise Selection & Sequence" -Body $b -Labels @("mvp","feature","vertical","core") -Milestone $msNum

# Update M3 Blocks
Write-Host "  Updating M3 Blocks -> #$($m4.number)..." -NoNewline
$m3body = (Send-GitHubApi -Endpoint "/issues/$($m3.number)").body
$m3body = $m3body -replace '_TBD \(M4 link added after creation\)_', "#$($m4.number) (M4: Exercise Selection & Sequence)"
Update-GHIssueBody -Num $m3.number -Body $m3body
Write-Host " OK" -ForegroundColor DarkGray

# --- M5 ---
$b = @(
    "## Outcome"
    "User can view, edit, and delete their past break sessions via:"
    "1. New page at ``src/pages/history.astro`` -- 'Historia przerw'"
    "2. Five CRUD API endpoints at ``src/pages/api/sessions/``"
    "3. Integration with M4 -- after each exercise sequence, ``POST /api/sessions`` creates a break_session record"
    "4. Topbar link 'Historia' between dashboard and sign-out"
    ""
    "Satisfies certification requirement: **domain CRUD (user-owned data) + non-empty business logic (no-repeat rule)**."
    ""
    "## PRD References"
    "FR-023 through FR-027, NFR-10"
    ""
    "## Dependencies"
    "**Depends on**: #$($m0.number) (M0: Auth), #$($m1.number) (M1: Database Schema)"
    "**Blocks**: Certification requirement, _TBD (M6 link added after creation)_"
    ""
    "## Acceptance Criteria"
    "- [ ] ``/history`` route exists and is gated (added to PROTECTED_ROUTES)"
    "- [ ] History page displays reverse-chronological list of user's break sessions"
    "- [ ] Each session shows: date/time, input kind+value, derived tags, exercise names, completed/skipped counts, editable note"
    "- [ ] Empty state: 'Nie masz jeszcze zadnych przerw. Wroc tu po pierwszym pomodoro.'"
    "- [ ] User can inline-edit the note field (textarea, <= 500 chars, auto-save on blur)"
    "- [ ] User can delete a session (confirm dialog, then DELETE)"
    "- [ ] Deleted session disappears without page refresh"
    "- [ ] ``POST /api/sessions`` creates new record, returns { id, ...row }"
    "- [ ] ``GET /api/sessions`` returns paginated list (limit 20, cursor-based)"
    "- [ ] ``GET /api/sessions/:id`` returns single record or 404 if not owned"
    "- [ ] ``PATCH /api/sessions/:id`` updates note field (whitelist), returns updated row"
    "- [ ] ``DELETE /api/sessions/:id`` hard-deletes, returns 204"
    "- [ ] All endpoints enforce RLS (user can only access own rows)"
    "- [ ] M4 exercise sequence end triggers POST with break payload"
    "- [ ] Topbar shows 'Historia' link for authenticated users"
    ""
    "## Risks"
    "| Risk | Mitigation |"
    "|---|---|"
    "| RLS misconfigured, user A sees user B's sessions (R-02, R-05) | Two-user integration test. |"
    "| POST failure leaves UI inconsistent | Optimistic UI: M4 proceeds regardless. |"
    "| Pagination cursor off-by-one | Use created_at < cursor (strict). Test with 20 sessions. |"
    "| Note field XSS | Astro auto-escapes. No set:html. 500-char server-side limit. |"
    "| Hard delete loses audit trail | Acceptable for MVP. Post-MVP: soft-delete. |"
    ""
    "## Estimated Effort"
    "6-8 hours"
    ""
    "---"
    "Full spec: ``context/foundation/roadmap.md`` section ``## M5: Break History CRUD``"
) -join "`n"

$m5 = New-GHIssue -Title "M5: Break History CRUD" -Body $b -Labels @("mvp","feature","vertical","certification") -Milestone $msNum

# Update M1 Blocks
Write-Host "  Updating M1 Blocks -> #$($m4.number), #$($m5.number)..." -NoNewline
$m1body = (Send-GitHubApi -Endpoint "/issues/$($m1.number)").body
$m1body = $m1body -replace '_TBD \(M4 \+ M5 links added after creation\)_', "#$($m4.number) (M4: Exercise Selection & Sequence), #$($m5.number) (M5: Break History CRUD)"
Update-GHIssueBody -Num $m1.number -Body $m1body
Write-Host " OK" -ForegroundColor DarkGray

# --- M6 ---
$b = @(
    "## Outcome"
    "Project meets certification minimum: **at least one test verifying functionality from the user's perspective**. Plus integration tests for access control and CRUD authorization."
    ""
    "Deliverables:"
    "1. Test framework installed (Playwright for E2E, Vitest for integration/unit)"
    "2. E2E test for US-01 (R-03) -- full pomodoro cycle"
    "3. Integration tests for R-01, R-02/R-05, R-04, R-13"
    "4. CI pipeline extended with test job"
    "5. Production deployment complete (Cloudflare Workers + Supabase)"
    "6. Manual validation of Guardrails G1/G2/G3"
    ""
    "## PRD References"
    "Test plan coverage: R-01, R-02, R-03, R-04, R-05, R-13"
    ""
    "## Dependencies"
    "**Depends on**: #$($m4.number) (M4: Exercise Selection), #$($m5.number) (M5: Break History CRUD)"
    "**Blocks**: Production-ready certification"
    ""
    "## Acceptance Criteria"
    ""
    "#### Test Framework Setup"
    "- [ ] ``package.json`` includes ``@playwright/test`` and ``vitest``"
    "- [ ] ``playwright.config.ts`` configured for ``http://localhost:4321``"
    "- [ ] ``vitest.config.ts`` configured for ``src/**/*.test.ts``"
    "- [ ] CI workflow has new job ``test`` after ``build``"
    ""
    "#### E2E Test (R-03)"
    "- [ ] Test file ``tests/e2e/pomodoro-cycle.spec.ts`` exists"
    "- [ ] Test: sign in, start timer, end, click 'Tylko kark', see >= 1 exercise, Done, 'Resume work?', Yes"
    "- [ ] Test passes on local ``npm run preview``"
    "- [ ] Test passes in CI"
    ""
    "#### Integration Tests"
    "- [ ] ``tests/integration/auth-gating.test.ts`` (R-01): unauthenticated GET /dashboard returns 302"
    "- [ ] ``tests/integration/crud-ownership.test.ts`` (R-02, R-05): two-user scenario"
    "- [ ] ``tests/unit/rule-engine.test.ts`` (R-04): all 4 quick-picks yield >= 1 exercise"
    "- [ ] ``tests/integration/delete-integrity.test.ts`` (R-13): DELETE then GET, expect 404"
    ""
    "#### Production Deployment"
    "- [x] Cloudflare Worker deployed (pomo-stretch) -- 2026-06-09"
    "- [x] Supabase production project created"
    "- [x] Production secrets set (SUPABASE_URL, SUPABASE_KEY)"
    "- [x] Auto-deploy via Cloudflare Workers Builds active"
    "- [ ] Supabase migrations applied to production (M1 tables)"
    "- [ ] Production URL accessible with new features"
    "- [ ] Full US-01 cycle tested on production (smoke test)"
    ""
    "#### Manual Guardrail Validation"
    "- [ ] G1 (NFR-1): Break content loads < 1.5s on staging"
    "- [ ] G2: Skip button at every exercise, no dead-ends"
    "- [ ] G3 (NFR-2): Page refresh during timer, resumes within +/- 2s"
    ""
    "## Risks"
    "| Risk | Mitigation |"
    "|---|---|"
    "| E2E tests flaky (timing issues) | Use Playwright waitForSelector with explicit timeouts. |"
    "| CI supabase start fails (Docker issues) | Use GitHub Actions service container or Cloud ephemeral project. |"
    "| Test data pollutes production | Hard-code test Supabase URL in test config. |"
    "| Missing secret on deploy | Pre-flight check: wrangler secret list. |"
    ""
    "## Estimated Effort"
    "6-8 hours"
    ""
    "---"
    "Full spec: ``context/foundation/roadmap.md`` section ``## M6: Testing & Certification``"
) -join "`n"

$m6 = New-GHIssue -Title "M6: Testing & Certification" -Body $b -Labels @("mvp","testing","cross-cutting") -Milestone $msNum

# Update M4 and M5 Blocks
Write-Host "  Updating M4 Blocks -> #$($m6.number)..." -NoNewline
$m4body = (Send-GitHubApi -Endpoint "/issues/$($m4.number)").body
$m4body = $m4body -replace '_TBD \(M6 link added after creation\)_', "#$($m6.number) (M6: Testing & Certification)"
Update-GHIssueBody -Num $m4.number -Body $m4body
Write-Host " OK" -ForegroundColor DarkGray

Write-Host "  Updating M5 Blocks -> #$($m6.number)..." -NoNewline
$m5body = (Send-GitHubApi -Endpoint "/issues/$($m5.number)").body
$m5body = $m5body -replace '_TBD \(M6 link added after creation\)_', "#$($m6.number) (M6: Testing & Certification)"
Update-GHIssueBody -Num $m5.number -Body $m5body
Write-Host " OK" -ForegroundColor DarkGray

# === Summary ===
Write-Host "`n=== DONE ===" -ForegroundColor Cyan
Write-Host "Milestone: MVP v1 (#$msNum)"
Write-Host ""
Write-Host "M0: #$($m0.number) - Auth Foundation (CLOSED)" -ForegroundColor DarkGreen
Write-Host "M1: #$($m1.number) - Database Schema & Exercise Catalog" -ForegroundColor White
Write-Host "M2: #$($m2.number) - Pomodoro Timer" -ForegroundColor White
Write-Host "M3: #$($m3.number) - Break Input & Keyword Matching" -ForegroundColor White
Write-Host "M4: #$($m4.number) - Exercise Selection & Sequence" -ForegroundColor White
Write-Host "M5: #$($m5.number) - Break History CRUD" -ForegroundColor White
Write-Host "M6: #$($m6.number) - Testing & Certification" -ForegroundColor White
Write-Host ""
Write-Host "Backlog: https://github.com/Michal3run/mvp-pomostretch/issues" -ForegroundColor Green
