Run the full CULTR Health pre-deployment checklist. Execute every step sequentially, fix any issues found, and report a final summary table with PASS/FAIL/WARN for each step.

## Checklist

### 1. TypeScript Compilation
Run `npx tsc --noEmit` and fix any type errors before proceeding.
- Report total error count
- Auto-fix if possible, otherwise list the errors

### 2. Test Suite
Run `npx vitest run --reporter=verbose` and ensure all tests pass.
- Report: X passed, Y failed, Z skipped
- If any fail, investigate and fix before proceeding
- Do NOT skip or ignore failing tests

### 3. ESLint
Run `npx next lint` and fix any violations.
- Auto-fix what you can with `npx next lint --fix`
- Report remaining warnings vs errors
- Errors = FAIL, warnings-only = WARN

### 4. Console Statement Audit
Search the entire codebase (app/, lib/, components/) for `console.log`, `console.debug`, `console.info` statements.
- Exclude: test files, config files, hooks, scripts
- Report count and locations
- WARN if found (acceptable in error handlers with console.error)

### 5. HIPAA Compliance Scan
Search for potential PHI logging patterns:
- `console.*` combined with: patient, ssn, dob, date_of_birth, social_security, medical, diagnosis, prescription, health_record
- Any unencrypted PII in API responses (names, emails, phone numbers in console output)
- FAIL if any PHI logging found

### 6. Hardcoded Secrets Check
Search for hardcoded API keys, tokens, passwords, or secrets outside of `.env*` files.
- Pattern: `api_key|secret|password|token` assigned to string literals (not `process.env`)
- Exclude: .env.example, documentation, test mocks
- FAIL if any real secrets found

### 7. Build Verification
Run `npm run build` and confirm it completes without errors.
- Report build time and output size if available
- Capture and report any warnings
- FAIL if build fails

### 8. Environment Variable Verification
For the target deployment environment ($ARGUMENTS or "staging" by default):

**Staging (staging.cultrhealth.com):**
Verify these critical env vars are set in Vercel by running `vercel env ls`:
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- POSTGRES_URL
- JWT_SECRET, SESSION_SECRET
- ASHER_MED_API_KEY, ASHER_MED_API_URL, ASHER_MED_PARTNER_ID
- NEXT_PUBLIC_SITE_URL
- RESEND_API_KEY, FROM_EMAIL
- CRON_SECRET

**Production (cultrhealth.com):**
All staging vars plus:
- TURNSTILE_SECRET_KEY
- ADMIN_APPROVAL_EMAIL, ADMIN_ALLOWED_EMAILS
- QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET

Report any missing vars as FAIL.

### 9. Site Health Check (staging only)
Run `npm run check:health:staging` if deploying to staging.
- Report tier-by-tier results
- FAIL if any Tier 1 (revenue-critical) checks fail
- WARN if Tier 2/3 checks fail

### 10. Git Status Verification
- Confirm current branch matches target: `staging` branch for staging, `production` branch for production
- Check for uncommitted changes — WARN if dirty working tree
- Check for unpushed commits — WARN if local is ahead of remote
- **CRITICAL:** Verify we are NOT about to `vercel --prod` from the wrong branch (see CLAUDE.md deployment safety rule)

### 11. Database Migration Check
- Compare migration files in `migrations/` against what's been run
- List any pending migrations that need to be applied
- WARN if pending migrations exist (they must be run manually)

### 12. Bundle Size Check
Check for obvious bundle bloat:
- Search for large imports that should be dynamically imported (e.g., recharts, @react-pdf/renderer outside their specific components)
- Verify homepage dynamic imports are still in place (PricingCard, FAQAccordion, ClubBanner, NewsletterSignup)
- WARN if any large library is imported at the top level of a page

## Summary Report

After all steps, output a formatted summary:

```
============================================
  CULTR Health Pre-Deploy Report
  Target: [staging|production]
  Branch: [current branch]
  Date:   [timestamp]
============================================

 1. TypeScript        [PASS/FAIL]  — 0 errors
 2. Tests             [PASS/FAIL]  — X passed, 0 failed
 3. ESLint            [PASS/WARN]  — 0 errors, Y warnings
 4. Console Stmts     [PASS/WARN]  — Z found
 5. HIPAA Compliance  [PASS/FAIL]  — Clean
 6. Secrets Check     [PASS/FAIL]  — Clean
 7. Build             [PASS/FAIL]  — Success (Xs)
 8. Env Variables     [PASS/FAIL]  — All set / N missing
 9. Site Health       [PASS/WARN]  — X/Y checks passed
10. Git Status        [PASS/WARN]  — Clean, up to date
11. DB Migrations     [PASS/WARN]  — None pending
12. Bundle Size       [PASS/WARN]  — No bloat detected

VERDICT: READY TO DEPLOY / BLOCKED (fix N issues)
============================================
```

If ANY step is FAIL, the verdict is BLOCKED. Fix all FAIL items before deploying.
If only WARN items exist, the verdict is READY TO DEPLOY (with warnings).
