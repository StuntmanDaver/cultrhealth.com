---
phase: 02
slug: checkout-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 02 — Validation Strategy

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
| 02-01-01 | 01 | 1 | CHK-01 | unit | `npx vitest run tests/lib/siphox-fulfillment.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | CHK-03 | unit | `npx vitest run tests/lib/siphox-fulfillment.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | CHK-04 | unit | `npx vitest run tests/lib/siphox-fulfillment.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | CHK-04 | unit | `npx vitest run tests/api/cron-siphox-fulfillment.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | CHK-02 | unit | `npx vitest run tests/api/checkout-subscription.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/siphox-fulfillment.test.ts` — stubs for CHK-01, CHK-03, CHK-04 (fulfillment orchestration, deferred orders, failure handling, refund notification)
- [ ] `tests/api/cron-siphox-fulfillment.test.ts` — stubs for CHK-03, CHK-04 (cron retry/deferred processing)
- [ ] `tests/api/checkout-subscription.test.ts` — stubs for CHK-02 (Checkout Session with optional blood test item)

*Existing infrastructure (Vitest + jsdom) covers framework needs. No new test dependencies required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stripe Checkout Session renders optional blood test add-on | CHK-02 | Stripe UI rendering is external | Create test Checkout Session in Stripe sandbox, verify add-on appears |
| Vercel cron fires on schedule | CHK-03 | Cron scheduling is Vercel infrastructure | Deploy to staging, check Vercel cron logs after 15 min |
| SiPhox API actually creates kit order | CHK-01 | External API call to SiPhox sandbox | Trigger webhook in staging, verify order in SiPhox dashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
