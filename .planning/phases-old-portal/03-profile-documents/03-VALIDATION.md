---
phase: 3
slug: profile-documents
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 + @testing-library/react ^16.3.2 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run tests/api/portal-profile.test.ts tests/api/portal-documents.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/api/portal-profile.test.ts tests/api/portal-documents.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PROF-01 | unit | `npx vitest run tests/api/portal-profile.test.ts -t "returns personal info"` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PROF-02 | unit | `npx vitest run tests/api/portal-profile.test.ts -t "returns address"` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | PROF-03 | unit | `npx vitest run tests/api/portal-profile.test.ts -t "updates address"` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | PROF-04 | unit | `npx vitest run tests/api/portal-profile.test.ts -t "returns measurements"` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | DOCS-01 | unit | `npx vitest run tests/api/portal-documents.test.ts -t "lists documents"` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | DOCS-02 | unit | `npx vitest run tests/api/portal-documents.test.ts -t "upload"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/api/portal-profile.test.ts` — stubs for PROF-01, PROF-02, PROF-03, PROF-04
- [ ] `tests/api/portal-documents.test.ts` — stubs for DOCS-01, DOCS-02
- [ ] Fix `@testing-library/dom` missing peer dependency: `npm install -D @testing-library/dom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Address edits sync to Asher Med | PROF-03 | Requires live Asher Med sandbox | 1. Edit address in portal 2. Check Asher Med partner portal for updated address |
| Document upload appears in Asher Med | DOCS-02 | Requires S3 presigned URL flow | 1. Upload file in portal 2. Verify file visible in Asher Med documents |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
