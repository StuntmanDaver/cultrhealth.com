---
phase: 3
slug: kit-registration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | KIT-01 | component | `npx vitest run tests/components/LabsClient.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | KIT-02 | unit | `npx vitest run tests/api/portal-labs-validate.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | KIT-03 | unit | `npx vitest run tests/api/portal-labs-register.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | KIT-04 | component | `npx vitest run tests/components/KitTimeline.test.tsx` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | KIT-05 | component | `npx vitest run tests/components/KitEmptyState.test.tsx` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | KIT-04 | unit | `npx vitest run tests/lib/kit-lifecycle.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/components/LabsClient.test.tsx` — stubs for KIT-01 (registration form rendering)
- [ ] `tests/api/portal-labs-validate.test.ts` — stubs for KIT-02 (validation API)
- [ ] `tests/api/portal-labs-register.test.ts` — stubs for KIT-03 (registration API)
- [ ] `tests/components/KitTimeline.test.tsx` — stubs for KIT-04 (timeline states)
- [ ] `tests/components/KitEmptyState.test.tsx` — stubs for KIT-05 (tier empty states)
- [ ] `tests/lib/kit-lifecycle.test.ts` — stubs for status derivation logic

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Horizontal stepper responsive collapse to vertical | KIT-04 | Visual layout responsive behavior | Resize browser below md breakpoint, verify timeline switches to vertical |
| Forest sidebar desktop + mobile drawer | KIT-01 | Layout integration visual check | View /portal/labs on desktop (sidebar visible) and mobile (hamburger drawer) |
| Dashboard summary card link to /portal/labs | KIT-05 | Navigation + visual integration | Click "View Labs" on dashboard summary card, verify navigation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
