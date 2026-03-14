---
phase: 4
slug: forms-renewals
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run tests/lib/portal-prefill.test.ts tests/api/portal-prefill.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/lib/portal-prefill.test.ts tests/api/portal-prefill.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | FORM-01 | unit | `npx vitest run tests/lib/portal-prefill.test.ts -t "intake"` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | FORM-02 | unit | `npx vitest run tests/lib/portal-prefill.test.ts -t "renewal"` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | FORM-05 | unit | `npx vitest run tests/lib/portal-prefill.test.ts -t "supply"` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | FORM-03 | unit | `npx vitest run tests/api/portal-prefill.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | FORM-03 | unit | `npx vitest run tests/api/portal-prefill.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | FORM-04 | unit | `npx vitest run tests/components/portal-renewal.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/portal-prefill.test.ts` — stubs for FORM-01, FORM-02, FORM-05
- [ ] `tests/api/portal-prefill.test.ts` — stubs for FORM-03
- [ ] `tests/components/portal-renewal.test.tsx` — stubs for FORM-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Intake form pre-fills correctly from live Asher Med data | FORM-01 | Requires real patient data | 1. Login to portal 2. Click "Start Intake" 3. Verify fields pre-populated |
| Renewal form pre-fills from last order | FORM-02 | Requires order history | 1. Login as patient with orders 2. Click "Renew" 3. Verify medication pre-selected |
| Renewal prompt appears when supply is low | FORM-05 | Requires order with known supply window | 1. Find patient with old order 2. Login 3. Check dashboard for renewal banner |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
