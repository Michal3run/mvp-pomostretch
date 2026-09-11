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

## Phase 2: Update Dependencies and Code Formatting (Deferred)

> **Status**: Deferred. Postponed to avoid merge conflicts and race conditions with concurrent active AI sessions modifying source files. Dependencies and formatting will be updated in a dedicated maintenance pass after all active feature branches land.

## Testing Strategy

### Unit Tests:

- Existing tests should continue to pass.

### Integration Tests:

- E2E tests in `tests/e2e/` should pass.

### Manual Testing Steps:

1. Verify root directory is clean of development scripts and prompt files.
2. Verify application builds and starts normally.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Remove Leftover Files and Directories

#### Automated

- [x] 1.1 All listed files and directories no longer exist: verified via `powershell -Command "Test-Path create-roadmap-issues.ps1, update-issues-body.ps1, update-roadmap-issues.ps1, GITHUB_ISSUES_PROMPT.md, GITHUB_ISSUES_PROMPT_NO_CLI.md, mvp-submit-checklist.md, eslint.log, ci-logs, playwright-report, test-results"` returns False for each item. — 1ee33f3

#### Manual

- [x] 1.2 Verify `git status` shows deleted tracked files, and filesystem check confirms removal of gitignored/untracked items (`eslint.log`, `ci-logs/`, `playwright-report/`, `test-results/`). — 1ee33f3
- [x] 1.3 Verify MVP submission readiness items before finalizing checklist deletion: GitHub Secrets confirmed, CI pipeline green, production deployment active, Supabase migrations applied, and core auth/timer flow verified. — 1ee33f3
