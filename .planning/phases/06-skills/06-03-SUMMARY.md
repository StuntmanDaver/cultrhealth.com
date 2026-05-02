---
phase: 06-skills
plan: 03
subsystem: skills, gitignore
tags: [skills, documentation, siphox, gitignore, deferred]
requires: []
provides:
  - ".gitignore exceptions for corepay-api and healthie-api skill directories"
  - "SKL-03 deferral audit record (D-12 rationale)"
  - "SiPhox skill repo-bug gotcha (BLOCKED — see Deferred Issues)"
affects:
  - .gitignore
  - .claude/skills/siphox-api/SKILL.md
tech-stack:
  added: []
  patterns: []
key-files:
  created:
    - .planning/phases/06-skills/06-03-SUMMARY.md
  modified:
    - .gitignore (+2 lines, 3 skill negations total: siphox-api, corepay-api, healthie-api)
decisions:
  - "D-11 honored: two new gitignore exceptions added (corepay-api, healthie-api)"
  - "D-12 honored: NO corpay-crossborder exception added; SKL-03 deferred-not-shipped"
  - "D-08 attempted: SiPhox SKILL.md repo-bug gotcha edit BLOCKED by Edit/Write permission denial"
metrics:
  duration: small
  completed: 2026-05-01
---

# Phase 06 Plan 03: Skills Cleanup Summary

Targeted cleanup plan for Phase 6 — appended .gitignore exceptions so Plans 01 and 02 outputs can be committed, attempted to refresh SiPhox skill with a known-bug gotcha, and recorded the SKL-03 scope reduction in the audit trail.

## Files Modified

| File | Change | Status |
|---|---|---|
| `.gitignore` | +2 lines (corepay-api, healthie-api negations under existing `# Project-specific skills` block) | Committed `185b8af` |
| `.claude/skills/siphox-api/SKILL.md` | Insert new gotcha #1 (repo-bug callout for `lib/siphox/client.ts:80`), renumber existing 1–10 to 2–11 | **BLOCKED — permission denied** |
| `.planning/phases/06-skills/06-03-SUMMARY.md` | New audit record (this file) | Will be committed |

## Tasks Completed

- **Task 1 (SKL-04 — SiPhox skill refresh):** **BLOCKED.** The Edit and Write tools were both denied permission on `.claude/skills/siphox-api/SKILL.md` (two attempts each). The bug location was verified at `lib/siphox/client.ts:80` (`'Authorization': \`Bearer ${apiKey}\``) before the edit was attempted, so the technical change is well-defined and ready to apply once permissions allow. See "Deferred Issues" below for the exact replacement block needed.
- **Task 2 (SKL-05 — .gitignore exceptions):** Done. Two new negation lines inserted between the existing `!.claude/skills/siphox-api/` line and the `skills-lock.json` line. Total skill negations now exactly 3 (siphox-api, corepay-api, healthie-api). NO `corpay-crossborder` line per D-12. Committed at `185b8af`.
- **Task 3 (SKL-03 deferral record):** Done — this SUMMARY.md is the audit record.

## SKL-03 status: DEFERRED PER D-12

**Original SKL-03 spec** (REQUIREMENTS.md line 21):
> `.claude/skills/corpay-crossborder/SKILL.md` exists as reference-only — explicitly notes Corpay (corpay.com, a **Fleetcor** company) is a **completely separate company** from Corepay (corepay.net, CULTR's merchant ISO) despite the similar name; Corpay Cross-Border is for B2B international FX/payouts and is **NOT** the consumer subscription processor. Reserved for potential future creator international-payout work; NOT used in v2.0.

**Decision reference:** D-12 in `.planning/phases/06-skills/06-CONTEXT.md` drops SKL-03 from Phase 6 scope. The corpay-crossborder skill was a disambiguation guard for a company (Corpay / Fleetcor) with zero presence in the source code; a guard skill adds noise without value. The disambiguation is captured in CLAUDE.md MEMORY index entry `feedback_corepay_vs_corpay_vs_authorize_net.md` AND in the corepay-api skill's Vocabulary section (Plan 01).

**Future trigger:** If creator international payouts are ever scoped, a Corpay research skill can be created at that point. Until then, SKL-03 is intentionally not shipped.

**Coverage note:** REQUIREMENTS.md SKL-03 entry remains as a historical record. The line is not deleted; only the deliverable is deferred.

## Verification

### Task 2 — .gitignore acceptance criteria

```
$ grep -E "^!\.claude/skills/corepay-api/$" .gitignore
!.claude/skills/corepay-api/

$ grep -E "^!\.claude/skills/healthie-api/$" .gitignore
!.claude/skills/healthie-api/

$ grep -E "^!\.claude/skills/siphox-api/$" .gitignore
!.claude/skills/siphox-api/

$ grep -cE "^!\.claude/skills/" .gitignore
3

$ grep "corpay-crossborder" .gitignore
(no output — D-12 honored)
```

All Task 2 acceptance criteria pass.

### Task 1 — SKILL.md acceptance criteria

NOT VERIFIED — edit was blocked by permission denial. The current SKILL.md still has the original 10 gotchas with the auth-prefix rule at #1. The new repo-bug gotcha is NOT present in the file.

## Sanity check

- `[ -f .claude/skills/corepay-api/SKILL.md ]` — true after Plan 01 ships (parallel wave)
- `[ -f .claude/skills/healthie-api/SKILL.md ]` — true after Plan 02 ships (parallel wave)
- `[ ! -d .claude/skills/corpay-crossborder/ ]` — TRUE (D-12 invariant — no directory created)
- `[ "$(grep -cE '^!\.claude/skills/' .gitignore)" = "3" ]` — TRUE (3 negations: siphox-api, corepay-api, healthie-api)

## Phase 6 progress

| Requirement | Status |
|---|---|
| **SKL-01** | Satisfied by Plan 01 (corepay-api skill — parallel wave) |
| **SKL-02** | Satisfied by Plan 02 (healthie-api skill — parallel wave) |
| **SKL-03** | DEFERRED per D-12 (no corpay-crossborder skill, by design) |
| **SKL-04** | **BLOCKED** — SiPhox skill edit denied by Edit/Write permission gate |
| **SKL-05** | Satisfied by this plan (Task 2 — .gitignore exceptions, commit `185b8af`) |

## Deferred Issues

### SKL-04 — SiPhox skill repo-bug gotcha edit was blocked by tooling

**What happened:** Both `Edit` and `Write` tool calls targeting `.claude/skills/siphox-api/SKILL.md` returned permission-denied. The bug location was verified at `lib/siphox/client.ts:80` (`'Authorization': \`Bearer ${apiKey}\``) before the edit was attempted, so the technical change is well-defined and ready to apply.

**Exact replacement still needed:** Replace the current `## Gotchas — read these first` section (lines 19-30 of SKILL.md, ending with `10. **GitBook docs are thin.** ...`) with this block:

```
## Gotchas — read these first

1. **Known repo bug: `lib/siphox/client.ts:80` sends `Authorization: Bearer` but SiPhox requires `Authorization: Token`.** The existing code is broken for auth and returns 401 "Business session is required" in production. Will be fixed in Phase 13. Until then, do not rely on `lib/siphox/client.ts` for live API calls — use the `siphoxFetch` helper in `references/client-starter.ts` instead.
2. **Auth prefix is `Token`, not `Bearer`.** `Authorization: Token <uuid>`. Anything else returns 401 "Business session is required".
3. **No `servers` block in the spec.** Always prepend `https://connect.siphoxhealth.com` manually — the spec ships with `servers: []`.
4. **Kit registration is async.** `POST /api/v1/kits/{kitID}/register` returns 200 immediately; lab processing happens later. Poll `/api/v1/kits` or `/api/v1/customers/{id}` to detect `sampleStatus = resulted`.
5. **Test orders require `is_test_order: true`** on `/create-order`. Otherwise you burn real credits / charge the attached payment method.
6. **`purchase_with_attached_payment` wording is ambiguous.** Per the spec, `false` first tries credits, then the attached payment method, then falls back to creating a pending order. Re-check the admin dashboard before sending anything else.
7. **`sai/upsells` uses stringified JSON.** `productOfferingsJson` is a string containing JSON — `JSON.stringify` the array on write, `JSON.parse` on read.
8. **503 "NOT_AVAILABLE"** is a legitimate response (e.g. `/kits/{kitID}/register` when the feature is not enabled for a business). Don't retry — surface to admin.
9. **Three separate status fields** on kits/samples/orders. Don't conflate them. See `references/kit-lifecycle.md`.
10. **Only four named schemas** — `Address`, `CreateOrderRequest`, `ProductOffering`, `Suggestion`. Everything else is inline. See `references/schemas.md`.
11. **GitBook docs are thin.** The OpenAPI spec is authoritative. If the spec and GitBook disagree, trust the spec and verify with a test order.
```

The edit is purely additive (10 → 11 gotchas) with renumbering 1→2, 2→3, …, 10→11. Nothing else in the file changes.

**Recommendation:** A follow-up agent or human edit can apply the change directly with `sed`, the Edit tool (with permission), or any text editor. The plan should re-run after permissions allow `.claude/skills/siphox-api/SKILL.md` writes, OR the edit can be applied manually outside the agent.

## Self-Check

- `.gitignore` modification: FOUND in working tree, FOUND in commit `185b8af`
- `.gitignore` 3-skill-negation invariant: VERIFIED via `grep -cE "^!\.claude/skills/" .gitignore` returning 3
- `.gitignore` no corpay-crossborder: VERIFIED via `grep "corpay-crossborder" .gitignore` returning empty
- `.claude/skills/siphox-api/SKILL.md` repo-bug gotcha: NOT applied — blocked by tool permission denial (documented in Deferred Issues)
- SUMMARY.md: created at `.planning/phases/06-skills/06-03-SUMMARY.md`

## Self-Check: PARTIAL

Task 2 (SKL-05) and Task 3 (SKL-03 audit + summary) completed and committable. Task 1 (SKL-04) blocked by tooling permission denial; replacement block documented above for follow-up.
