---
phase: 03
slug: kit-registration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 03 — Validation Strategy

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
| 03-01-01 | 01 | 1 | KIT-04 | unit | `npx vitest run tests/lib/kit-lifecycle.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-01 | 01 | 1 | KIT-01 | unit | `npx vitest run tests/api/portal-labs.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-01 | 01 | 1 | KIT-02 | unit | `npx vitest run tests/api/portal-labs-validate.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-01-01 | 01 | 1 | KIT-03 | unit | `npx vitest run tests/api/portal-labs-register.test.ts -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | KIT-04 | component | `npx vitest run tests/components/KitTimeline.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | KIT-05 | component | `npx vitest run tests/components/KitEmptyState.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | KIT-02 | component | `npx vitest run tests/components/KitRegistrationForm.test.tsx -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | KIT-01 | component | `npx vitest run tests/components/LabsClient.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/kit-lifecycle.test.ts` — stubs for deriveKitLifecycleState (KIT-04)
- [ ] `tests/api/portal-labs.test.ts` — stubs for GET /api/portal/labs (KIT-01)
- [ ] `tests/api/portal-labs-validate.test.ts` — stubs for POST /api/portal/labs/validate (KIT-02)
- [ ] `tests/api/portal-labs-register.test.ts` — stubs for POST /api/portal/labs registration (KIT-03)
- [ ] `tests/components/KitTimeline.test.tsx` — stubs for timeline rendering (KIT-04)
- [ ] `tests/components/KitEmptyState.test.tsx` — stubs for tier-based empty states (KIT-05)
- [ ] `tests/components/KitRegistrationForm.test.tsx` — stubs for validation error messages (KIT-02)
- [ ] `tests/components/LabsClient.test.tsx` — stubs for registration form visibility logic (KIT-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Horizontal stepper collapses to vertical on mobile | KIT-04 | Responsive layout testing requires browser viewport | Resize below md breakpoint, verify vertical timeline |
| Portal sidebar renders with forest theme | KIT-01 | Visual design verification | Check sidebar has forest bg, white text, active state |
| Dashboard summary card links to labs | KIT-05 | Navigation integration | Click card on dashboard, verify navigation to /portal/labs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
