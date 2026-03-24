---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - migrations/025_jon21_discount_10.sql
  - tests/integration/creator-e2e-jon-collins.test.ts
autonomous: true
requirements: [JON21-DISCOUNT]
must_haves:
  truths:
    - "JON21 coupon gives customers 10% discount (down from 20%)"
    - "Jon Collins commission rate remains 20% (unchanged)"
    - "E2E test fixture reflects the new 10% discount value"
  artifacts:
    - path: "migrations/025_jon21_discount_10.sql"
      provides: "DB migration to update JON21 discount_value from 20 to 10"
      contains: "UPDATE affiliate_codes SET discount_value = 10"
    - path: "tests/integration/creator-e2e-jon-collins.test.ts"
      provides: "Updated test fixture with discount_value: 10"
      contains: "discount_value: 10"
  key_links: []
---

<objective>
Change Jon Collins' JON21 coupon from 20% customer discount to 10% customer discount. His 20% commission rate stays the same.

Purpose: Business decision to reduce the customer-facing discount while maintaining creator commission.
Output: SQL migration + updated test fixture.
</objective>

<execution_context>
@/Users/davidk/.claude/get-shit-done/workflows/execute-plan.md
@/Users/davidk/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@migrations/024_prelaunch_codes.sql
@tests/integration/creator-e2e-jon-collins.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create DB migration and update test fixture</name>
  <files>migrations/025_jon21_discount_10.sql, tests/integration/creator-e2e-jon-collins.test.ts</files>
  <action>
1. Create `migrations/025_jon21_discount_10.sql` with:
   ```sql
   -- Migration 025: Change JON21 coupon discount from 20% to 10%
   -- Jon Collins' commission rate (20%) is unchanged — only customer discount changes.
   UPDATE affiliate_codes
   SET discount_value = 10,
       updated_at = NOW()
   WHERE code = 'JON21';
   ```

2. In `tests/integration/creator-e2e-jon-collins.test.ts`, update the `JON_CODE` fixture (line 108):
   - Change `discount_value: 20` to `discount_value: 10`

3. Verify Jon Collins' commission rate is NOT touched — the `creators` table already has `commission_rate = 20.00` and must remain unchanged. Do NOT create any migration or code change for commission rate.
  </action>
  <verify>
    <automated>grep -n "discount_value" tests/integration/creator-e2e-jon-collins.test.ts | head -5 && grep "discount_value = 10" migrations/025_jon21_discount_10.sql</automated>
  </verify>
  <done>Migration file exists with UPDATE setting discount_value=10 for JON21. Test fixture shows discount_value: 10. No commission_rate changes anywhere.</done>
</task>

</tasks>

<verification>
- `migrations/025_jon21_discount_10.sql` exists and contains UPDATE for JON21 discount_value to 10
- `tests/integration/creator-e2e-jon-collins.test.ts` fixture has `discount_value: 10`
- No changes to `creators` table or commission_rate anywhere
- `npm test` passes (test fixture is consistent)
</verification>

<success_criteria>
- JON21 coupon discount_value will be 10% after migration runs
- Jon Collins commission_rate remains 20% (untouched)
- Test fixture updated to match new discount value
</success_criteria>

<output>
After completion, create `.planning/quick/3-change-jon-collins-jon21-coupon-to-10-cu/3-SUMMARY.md`
</output>
