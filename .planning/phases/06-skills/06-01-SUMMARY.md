---
phase: 06-skills
plan: 01
subsystem: skills, payments
tags: [skills, documentation, corepay, authorize-net, spec-forward]
requires: []
provides:
  - "Corepay/Authorize.Net skill for future Claude Code sessions"
  - "Spec-forward API surface documentation guiding Phase 7 implementation"
  - "Vocabulary disambiguation: Corepay ≠ Authorize.Net ≠ Corpay"
affects:
  - .claude/skills/corepay-api/SKILL.md
tech-stack:
  added: []
  patterns: ["claude-code-skill", "spec-forward-doc"]
key-files:
  created:
    - .claude/skills/corepay-api/SKILL.md
  modified: []
decisions:
  - "D-01 honored: spec-forward — full Phase 7 API surface documented with `<!-- Phase 7 -->` HTML markers (37 occurrences)"
  - "D-02 honored: authorizenet npm SDK gotcha includes failure mode (HMAC signature envelope breakage)"
  - "D-03 honored: Vocabulary section appears at top before any other content; Corpay URL `developer.crossborder.corpay.com` documented as the trap reference"
  - "D-04 honored: frontmatter trigger lists COREPAY_TRANSACTION_KEY, NEXT_PUBLIC_COREPAY_API_LOGIN_ID, gatewayFetch, ARBCreateSubscriptionRequest, createCustomerProfile, lib/payments/corepay-*.ts"
  - "D-09 honored: single SKILL.md file, no references/ subdirectory"
  - "D-10 honored: frontmatter pattern matches siphox-api (name + description with embedded triggers)"
metrics:
  duration: medium
  completed: 2026-05-02
  file_size: 17823 bytes
  line_count: 224
  section_count: 17
---

# Phase 06 Plan 01: Corepay/Authorize.Net Skill Summary

Wrote `.claude/skills/corepay-api/SKILL.md` — a single-file Claude Code skill that future sessions auto-load when working on Corepay/Authorize.Net code. The skill is **spec-forward** per D-01: it documents the full intended Phase 7 API surface (CIM, Accept.js token flow, HMAC-SHA512 webhooks, ARB update next-cycle rule) even though only ARB subscription create exists today. Unimplemented sections are bracketed with `<!-- Phase 7 -->` HTML comment markers.

## Files Modified

| File | Change | Status |
|---|---|---|
| `.claude/skills/corepay-api/SKILL.md` | Created (224 lines) | Pending commit (parallel agent didn't commit due to .gitignore) |

## Recovery Notes

The 06-01 executor agent created the SKILL.md correctly inside its worktree at `.claude/worktrees/agent-a9f150df5c330c9e4/.claude/skills/corepay-api/SKILL.md` but never committed it because the worktree's `.gitignore` was based on the pre-Phase-6 state, which still blocked `.claude/skills/corepay-api/`. Plan 06-03 added the negation `!.claude/skills/corepay-api/` to `.gitignore` in a separate worktree, but the change had not yet propagated to the 06-01 worktree's view at the time the agent attempted to add files. The agent itself returned no completion notification (silent stall).

The orchestrator recovered the SKILL.md by copying it from the worktree to the main repo after the 06-03 .gitignore exception was merged. The file content is identical to what the agent produced.

## Verification

```
$ test -f .claude/skills/corepay-api/SKILL.md && echo "EXISTS"
EXISTS

$ wc -l .claude/skills/corepay-api/SKILL.md
224

$ grep -c "^## " .claude/skills/corepay-api/SKILL.md
17

$ grep -c "Phase 7" .claude/skills/corepay-api/SKILL.md
37

$ grep "^---$" .claude/skills/corepay-api/SKILL.md | head -2
---
---

$ grep "name: corepay-api" .claude/skills/corepay-api/SKILL.md
name: corepay-api

$ grep "Vocabulary" .claude/skills/corepay-api/SKILL.md | head -1
## Vocabulary — do not conflate these three companies

$ grep "developer.crossborder.corpay.com" .claude/skills/corepay-api/SKILL.md
> The URL **developer.crossborder.corpay.com** is for Corpay (Fleetcor)...
```

Acceptance criteria from PLAN 06-01 satisfied.

## Self-Check: PASSED

Skill file present, frontmatter valid, vocabulary section first, 7+ gotchas with failure modes, spec-forward markers throughout, file size matches agent-produced content.
