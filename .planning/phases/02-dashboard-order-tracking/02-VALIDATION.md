---
phase: 02
slug: dashboard-order-tracking
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 + React Testing Library ^16.3.2 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ORDR-04 | unit | `npx vitest run tests/lib/portal-orders.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | ORDR-01 | unit | `npx vitest run tests/api/portal-orders.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | ORDR-03 | unit | `npx vitest run tests/api/portal-order-detail.test.ts -x` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | ORDR-02, ORDR-05 | unit | `npx vitest run tests/components/PortalDashboard.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/portal-orders.test.ts` — status mapping for all 6 AsherOrderStatus values (ORDR-04)
- [ ] `tests/api/portal-orders.test.ts` — API proxy: auth check, order list, error handling (ORDR-01)
- [ ] `tests/api/portal-order-detail.test.ts` — detail fetch, ownership verification, 403 on mismatch (ORDR-03)
- [ ] `tests/components/PortalDashboard.test.tsx` — hero card rendering, empty state, loading state (ORDR-02, ORDR-05)

*Existing infrastructure covers framework and config. Only test files are missing.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Slide-over panel animation | ORDR-03 | CSS transition visual quality | Open order detail, verify panel slides from right smoothly |
| Hero card visual prominence | ORDR-02 | Design review | Verify hero card is visually distinct from compact list |
| Mobile stacked layout | ORDR-02 | Responsive design | View dashboard on mobile viewport, verify single-column layout |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
