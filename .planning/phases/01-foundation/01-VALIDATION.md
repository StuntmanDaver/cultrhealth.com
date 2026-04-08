---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| **Config file** | vitest.config.js |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | API-01 | unit | `npx vitest run tests/lib/siphox-client.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | API-02 | unit | `npx vitest run tests/lib/siphox-schemas.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | API-03 | unit | `npx vitest run tests/lib/siphox-client.test.ts -t "createCustomer" -x` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | API-04 | unit | `npx vitest run tests/lib/siphox-client.test.ts -t "getCustomerByExternalId" -x` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | API-05 | unit | `npx vitest run tests/lib/siphox-client.test.ts -t "checkCreditBalance" -x` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | DB-01 | unit | `npx vitest run tests/lib/siphox-db.test.ts -t "upsertSiphoxCustomer" -x` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | DB-02 | unit | `npx vitest run tests/lib/siphox-db.test.ts -t "kitOrders" -x` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | DB-03 | unit | `npx vitest run tests/lib/siphox-db.test.ts -t "reports" -x` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 1 | DB-04 | unit | `npx vitest run tests/lib/siphox-biomarkers.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/siphox-client.test.ts` — stubs for API-01 through API-05 (mock fetch, verify request shapes, test Zod validation)
- [ ] `tests/lib/siphox-schemas.test.ts` — stubs for API-02 (known-good and known-bad response fixtures)
- [ ] `tests/lib/siphox-db.test.ts` — stubs for DB-01 through DB-03 (mock @vercel/postgres sql, verify query shapes)
- [ ] `tests/lib/siphox-biomarkers.test.ts` — stubs for DB-04 (config completeness, category coverage, no duplicate siphoxNames)
- [ ] `tests/setup.ts` needs `process.env.SIPHOX_API_KEY = 'test-siphox-key'` and `process.env.SIPHOX_API_URL = 'https://connect.siphoxhealth.com/api/v1'` added

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real SiPhox API connectivity | API-01 | Requires live API key and network access | 1. Set SIPHOX_API_KEY env var 2. Run smoke test script against sandbox 3. Verify 200 response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
