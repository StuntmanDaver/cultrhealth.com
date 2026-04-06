---
status: awaiting_human_verify
trigger: "Investigate issue: creator-revenue-admin-sync"
created: 2026-04-05T17:31:00Z
updated: 2026-04-05T17:40:00Z
---

## Current Focus

hypothesis: confirmed and fixed in the audited revenue-sync slice; no newly proven root cause remains after expanded regression verification
test: finalize findings and carry forward only residual live-environment gaps
expecting: concise final report that separates confirmed fix from remaining untested workflow edges
next_action: return final finding set plus residual risks/gaps

## Symptoms

expected: Coupon application on the join funnel should validate correctly, the resulting order should attribute to the correct creator and create or advance commission records correctly, and admin surfaces should reflect the same order and commission state without stale or missing data.
actual: The human partner does not trust the flow end-to-end and wants a meticulous verification. They suspect multiple parts may be wrong but have no single pinned-down error yet.
errors: No concrete error messages yet.
reproduction: Manual concern based on current system behavior; investigate from code, nearby tests, and any reproducible local evidence available.
started: Not sure when this started; may relate to recent changes in join or creator or admin flows.

## Eliminated

## Evidence

- timestamp: 2026-04-05T17:31:00Z
  checked: .planning/debug/knowledge-base.md
  found: No debug knowledge base file exists yet in .planning/debug.
  implication: There is no prior known-pattern entry to bias the investigation; this audit needs fresh evidence from code and tests.

- timestamp: 2026-04-05T17:31:00Z
  checked: .planning/debug/join-page-returning-members.md
  found: A recent join-domain debug session exists and is awaiting human verification. It focused on member recognition, server/member lookup, and join-club state handling; it did not diagnose creator revenue attribution or admin revenue sync.
  implication: Recent join flow changes are a plausible context factor, but no prior evidence yet ties them to the creator/admin revenue path.

- timestamp: 2026-04-05T17:33:00Z
  checked: app/api/club/validate-coupon/route.ts, app/api/club/orders/route.ts, app/api/webhook/stripe/route.ts, lib/config/coupons.ts, lib/config/join-therapies.ts, lib/creators/attribution.ts, lib/creators/commission.ts, lib/creators/db.ts
  found: Coupon validation, join catalog normalization, attribution resolution, and commission creation are wired together consistently for priced club orders: club orders insert `club_orders`, then create `order_attributions` / `commission_ledger`; Stripe subscription attribution resolves coupon codes and routes into the same creator commission helpers.
  implication: The initial order write path is coherent; the higher-risk sync seam is later admin mutation of club order status rather than coupon validation or initial attribution creation.

- timestamp: 2026-04-05T17:33:00Z
  checked: app/api/admin/club-orders/[orderId]/approve/route.ts, app/api/admin/club-orders/[orderId]/status/route.ts, app/api/admin/club-orders/[orderId]/dismiss/route.ts
  found: Approval can update zero-revenue placeholders into real attribution/commission records, but cancellation and dismissal only update `club_orders.status`. There is no corresponding reversal or status update for `order_attributions` or `commission_ledger`.
  implication: Admin order state can diverge from creator attribution/commission state after cancellation or dismissal.

- timestamp: 2026-04-05T17:33:00Z
  checked: lib/creators/db.ts (`getCreatorDashboardStats`, `getCreatorCommissionStats`) and lib/db.ts (`getCreatorCommissionStats`, `getCouponStats`, `getInvoiceAging`, `getClubOrderFulfillmentCounts`)
  found: Creator reporting queries continue counting attribution rows and commission rows unless they are explicitly marked `refunded`/`reversed`; they do not join back to `club_orders.status` to exclude cancelled or dismissed club orders.
  implication: Once an attributed club order is cancelled or dismissed, creator/admin metrics remain inflated until the attribution/commission rows are actively reversed.

- timestamp: 2026-04-05T17:33:39Z
  checked: `npx vitest run tests/lib/creator-payout-lifecycle.test.ts tests/api/club-validate-coupon.test.ts tests/api/club-orders-catalog-sync.test.ts tests/api/stripe-webhook-attribution.test.ts`
  found: Coupon validation, club order catalog sync, and Stripe attribution tests passed. The only failing targeted test was `tests/lib/creator-payout-lifecycle.test.ts`, which expects `reverseCommissionsForAttribution()` to reverse `paid` rows too, but the implementation currently reverses only `pending` and `approved`.
  implication: There is executable evidence that the reversal path is incomplete even before wiring it into admin cancellation/dismissal flows.

- timestamp: 2026-04-05T17:36:23Z
  checked: code changes in `lib/creators/db.ts`, `app/api/admin/club-orders/[orderId]/status/route.ts`, `app/api/admin/club-orders/[orderId]/dismiss/route.ts`, plus targeted regression tests
  found: The reversal helper now includes `paid` rows and has a restore companion; admin status transitions to `cancelled` now reverse and mark linked attributions as `refunded`; reopening a cancelled order restores linked commissions and resets attribution to `pending`; dismissing an order applies the same reversal behavior.
  implication: The confirmed creator/admin sync gap is fixed at the write-path mutation points instead of papered over in downstream reporting queries.

- timestamp: 2026-04-05T17:36:23Z
  checked: `npx vitest run tests/lib/creator-payout-lifecycle.test.ts tests/api/admin-club-order-attribution-sync.test.ts tests/api/club-validate-coupon.test.ts tests/api/club-orders-catalog-sync.test.ts tests/api/stripe-webhook-attribution.test.ts`
  found: All 5 targeted test files passed (16 tests total), including the previously failing commission reversal test and the new admin club-order attribution sync tests.
  implication: The fix is mechanically verified across the audited revenue path slice and has focused regression coverage.

- timestamp: 2026-04-05T17:40:00Z
  checked: additional verification supplied after checkpoint — `tests/integration/coupon-attribution-e2e.test.ts`, `tests/integration/creator-e2e-jon-collins.test.ts`, and `tests/api/admin-creator-auth-and-payouts.test.ts`
  found: Expanded regression verification passed as well: 3 additional files, 43 tests passed, and no lints were reported on edited files.
  implication: The creator attribution, commission, and adjacent admin/creator route behavior remained stable after the fix, increasing confidence that the cancellation/dismissal sync issue was the only proven root cause in this slice.

## Resolution

root_cause:
  Admin club-order cancellation and dismissal updated only `club_orders.status`, while creator dashboards and admin commission analytics continued reading untouched `order_attributions` and `commission_ledger` rows. This left cancelled or dismissed join orders still counted as creator revenue/commission. The existing reversal helper was also incomplete because it ignored `paid` commission rows.
fix:
  Updated `reverseCommissionsForAttribution()` to include `paid` rows and added `restoreCommissionsForAttribution()` in `lib/creators/db.ts`. Wired `app/api/admin/club-orders/[orderId]/status/route.ts` to reverse linked attribution/commission state on `cancelled` and restore it when reopening from `cancelled`. Wired `app/api/admin/club-orders/[orderId]/dismiss/route.ts` to reverse linked attribution/commission state when dismissing an order. Added focused route regression tests and extended the payout-lifecycle helper test.
verification:
  Targeted tests passed: `tests/lib/creator-payout-lifecycle.test.ts`, `tests/api/admin-club-order-attribution-sync.test.ts`, `tests/api/club-validate-coupon.test.ts`, `tests/api/club-orders-catalog-sync.test.ts`, `tests/api/stripe-webhook-attribution.test.ts`. Additional verification also passed: `tests/integration/coupon-attribution-e2e.test.ts`, `tests/integration/creator-e2e-jon-collins.test.ts`, and `tests/api/admin-creator-auth-and-payouts.test.ts`. `ReadLints` reported no issues in edited files.
files_changed:
  - lib/creators/db.ts
  - app/api/admin/club-orders/[orderId]/status/route.ts
  - app/api/admin/club-orders/[orderId]/dismiss/route.ts
  - tests/lib/creator-payout-lifecycle.test.ts
  - tests/api/admin-club-order-attribution-sync.test.ts
