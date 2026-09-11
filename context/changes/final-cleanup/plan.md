# Final Repo Cleanup Implementation Plan

## Overview

Cleaning up the PomoStretch repository before MVP review by removing leftover scripts, prompt files, test artifacts, and ensuring all dependencies and code formatting are up to date.

## Current State Analysis

The repository contains several 10xdevs-specific instruction files (`GITHUB_ISSUES_PROMPT.md`), PowerShell scripts for issue management (`*.ps1`), unused files (`eslint.log`), and test output directories (`ci-logs/`, `playwright-report/`, `test-results/`) that should not be committed for the final submission. Note that IDE/agent instruction files (`AGENTS.md`, `CLAUDE.md`, `KIRO.md`) are intentionally preserved. Dependencies have minor updates available, and we need to ensure the project is fully formatted and linted.

## Desired End State

A clean repository containing only the actual MVP source code, tests, and standard configuration files. All code is formatted, linted, and dependencies are updated to their latest compatible versions.

## What We're NOT Doing

- We are not changing any feature logic or architecture.
- We are not upgrading dependencies to new major versions (to avoid breaking changes).
- We are not deleting IDE/agent convention files (`AGENTS.md`, `CLAUDE.md`, `KIRO.md`).

## Implementation Approach

1. Delete all leftover scripts and documentation files.
2. Delete transient test result and log directories.
3. Update minor/patch dependencies.
4. Run project-wide format and lint commands.

## Phase 1: Remove Leftover Files and Directories

### Overview

Delete scripts and markdown files not part of the core MVP, and remove temporary output folders.

### Changes Required:

#### 1. Remove PowerShell Scripts

**File**: `create-roadmap-issues.ps1`, `update-issues-body.ps1`, `update-roadmap-issues.ps1`

**Intent**: Delete `.ps1` scripts used for managing issues during development.

**Contract**: Remove these files from the project.

#### 2. Remove Prompt and Checklist Markdown Files

**File**: `GITHUB_ISSUES_PROMPT.md`, `GITHUB_ISSUES_PROMPT_NO_CLI.md`, `mvp-submit-checklist.md`

**Intent**: Delete instructions and checklists not needed in the final codebase (`KIRO.md` is retained alongside `CLAUDE.md`).

**Contract**: Remove these files from the project.

#### 3. Remove Log Files and Output Directories

**File**: `eslint.log`, `ci-logs/`, `playwright-report/`, `test-results/`

**Intent**: Clean up test and CI artifacts.

**Contract**: Remove these files and directories from the project.

### Success Criteria:

#### Automated Verification:

- All listed files and directories no longer exist: verified via `powershell -Command "Test-Path create-roadmap-issues.ps1, update-issues-body.ps1, update-roadmap-issues.ps1, GITHUB_ISSUES_PROMPT.md, GITHUB_ISSUES_PROMPT_NO_CLI.md, mvp-submit-checklist.md, eslint.log, ci-logs, playwright-report, test-results"` returns False for each item.

#### Manual Verification:

- Verify `git status` shows deleted tracked files, and filesystem check confirms removal of gitignored/untracked items (`eslint.log`, `ci-logs/`, `playwright-report/`, `test-results/`).
- Verify MVP submission readiness items before finalizing checklist deletion: GitHub Secrets confirmed, CI pipeline green, production deployment active, Supabase migrations applied, and core auth/timer flow verified.

---

## Phase 2: Update Dependencies and Code Formatting

### Overview

Ensure dependencies are up to date and codebase formatting is clean.

### Changes Required:

#### 1. Update Dependencies

**File**: `package.json`

**Intent**: Update to the latest compatible minor/patch dependency versions.

**Contract**: Run `npm update` and verify `package-lock.json` changes.

#### 2. Format and Lint Codebase

**File**: All source files

**Intent**: Fix any formatting or linting issues in the codebase.

**Contract**: Run `npm run format` and `npm run lint`. Fix any errors if they arise.

### Success Criteria:

#### Automated Verification:

- `npm run lint` passes without errors.
- `npm run build` completes successfully.
- Unit tests pass: `npm test`.
- Playwright E2E suite passes: `npm run test:e2e`.

#### Manual Verification:

- Application starts successfully with `npm run dev`.

## Testing Strategy

### Unit Tests:

- Existing tests should continue to pass.

### Integration Tests:

- E2E tests in `tests/e2e/` should pass.

### Manual Testing Steps:

1. Start application and ensure homepage loads.
2. Verify no runtime errors in the console.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Remove Leftover Files and Directories

#### Automated

- [x] 1.1 All listed files and directories no longer exist: verified via `powershell -Command "Test-Path create-roadmap-issues.ps1, update-issues-body.ps1, update-roadmap-issues.ps1, GITHUB_ISSUES_PROMPT.md, GITHUB_ISSUES_PROMPT_NO_CLI.md, mvp-submit-checklist.md, eslint.log, ci-logs, playwright-report, test-results"` returns False for each item.

#### Manual

- [x] 1.2 Verify `git status` shows deleted tracked files, and filesystem check confirms removal of gitignored/untracked items (`eslint.log`, `ci-logs/`, `playwright-report/`, `test-results/`).
- [x] 1.3 Verify MVP submission readiness items before finalizing checklist deletion: GitHub Secrets confirmed, CI pipeline green, production deployment active, Supabase migrations applied, and core auth/timer flow verified.

### Phase 2: Update Dependencies and Code Formatting

#### Automated

- [ ] 2.1 `npm run lint` passes without errors.
- [ ] 2.2 `npm run build` completes successfully.
- [ ] 2.3 Unit tests pass: `npm test`.
- [ ] 2.4 Playwright E2E suite passes: `npm run test:e2e`.

#### Manual

- [ ] 2.5 Application starts successfully with `npm run dev`.
