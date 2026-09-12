---
change_id: m2-pomodoro-timer
title: M2: Pomodoro Timer
status: archived
created: 2026-07-16
updated: 2026-09-12
archived_at: 2026-09-12T20:20:32Z
---

## Notes

Pomodoro timer UI and state management covering FR-005 through FR-009 and NFR-2 (timer durability / Guardrail G3). Dashboard transforms from a placeholder into a functional 25-minute timer with live countdown, +5 min extension, manual early termination ("Zaczynaj przerwę"), auto-transition on 00:00, localStorage persistence under 'pomostretch.timer', and expired session recovery state when away >60s.
