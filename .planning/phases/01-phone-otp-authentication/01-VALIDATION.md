---
phase: 1
slug: phone-otp-authentication
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01 | 01 | 1 | AUTH-03, AUTH-04, AUTH-06 | unit | `npx vitest run tests/lib/portal-auth.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-02 | 01 | 1 | AUTH-01, AUTH-08 | unit + integration | `npx vitest run tests/api/portal-send-otp.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-03 | 01 | 1 | AUTH-01, AUTH-07, AUTH-10 | unit + integration | `npx vitest run tests/api/portal-verify-otp.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-04 | 01 | 1 | AUTH-05 | unit | `npx vitest run tests/api/portal-logout.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-05 | 01 | 1 | AUTH-02, AUTH-09 | unit (component) | `npx vitest run tests/components/PortalLogin.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/portal-auth.test.ts` — covers AUTH-03, AUTH-04, AUTH-06 (dual-token creation, verification, cookie separation)
- [ ] `tests/api/portal-send-otp.test.ts` — covers AUTH-01, AUTH-08 (OTP send, rate limiting)
- [ ] `tests/api/portal-verify-otp.test.ts` — covers AUTH-01, AUTH-07, AUTH-10 (OTP verify, patient resolution, error handling)
- [ ] `tests/api/portal-logout.test.ts` — covers AUTH-05 (cookie clearing)
- [ ] `tests/components/PortalLogin.test.tsx` — covers AUTH-02, AUTH-09 (component rendering, autocomplete, phone mask)
- [ ] Mock for Twilio SDK in test setup (`vi.mock('twilio')`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SMS actually delivered to real phone | AUTH-01 | Requires real Twilio account + phone | Send OTP to test phone number, verify SMS arrives within 30s |
| Browser session persistence across restart | AUTH-03 | Requires real browser state | Login → close browser → reopen → verify still authenticated |
| Cookie httpOnly flag inspection | AUTH-03 | Requires browser DevTools | Login → DevTools → Application → Cookies → verify httpOnly=true, secure=true |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
