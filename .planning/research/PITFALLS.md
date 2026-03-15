# Domain Pitfalls

**Domain:** SiPhox Health blood test API integration — kit ordering, registration, biomarker results display
**Researched:** 2026-03-14
**Confidence:** HIGH (verified against codebase patterns, SiPhox API schemas from PROJECT.md, Stripe docs, HIPAA enforcement actions)

---

## Critical Pitfalls

Mistakes that cause HIPAA violations, broken checkout flows, lost customer data, or rewrites.

---

### Pitfall 1: SiPhox Customer Creation Race Condition on Checkout

**What goes wrong:** The Stripe webhook handler (`app/api/webhook/stripe/route.ts`) fires `checkout.session.completed` and needs to create a SiPhox customer + order for Catalyst+/Concierge subscribers. But the webhook fires asynchronously -- the member's CULTR account may not exist in the local DB yet when the webhook arrives. The existing codebase already has this pattern: the webhook tries to look up `asher_patient_id` from `asher_orders` by email, and if the patient hasn't completed intake yet, the lookup fails silently. With SiPhox, the same problem occurs: you cannot create a SiPhox order for a customer who doesn't exist in SiPhox yet, and you cannot create a SiPhox customer without the member's shipping address (required by `CreateOrderRequest`).

**Why it happens:** Stripe webhooks are non-deterministic in timing. The `checkout.session.completed` webhook may arrive before the member's shipping address is stored locally (it comes from intake forms, which happen after checkout). The SiPhox `POST /customer` and `POST /orders` calls are sequential dependencies -- customer must exist before order can reference them.

**Consequences:** Member pays for a tier that includes blood tests, but no kit is ever ordered. No error is surfaced to the member. Support gets confused tickets weeks later when kits never arrive. Credits are not consumed, so no financial loss, but the member experience is broken.

**Prevention:**
1. **Deferred order pattern:** On `checkout.session.completed`, record the SiPhox order _intent_ in a local `siphox_orders` table with `status: 'pending_address'`. Do NOT call SiPhox API yet.
2. **Trigger on address availability:** When the member submits their intake form (which includes shipping address), check for pending SiPhox orders and fulfill them at that point. The intake form already collects `ShippingAddressForm` data.
3. **Fallback cron:** Build a cron job (like the existing `cron/approve-commissions`) that checks for `pending_address` SiPhox orders older than 24 hours and alerts admin.
4. **For Core add-on ($135):** The address is available at checkout time (Stripe Checkout collects it), so this path can order immediately from the webhook.

**Detection:** Query `siphox_orders WHERE status = 'pending_address' AND created_at < NOW() - INTERVAL '48 hours'`. Any rows mean kits were never ordered.

**Phase:** Phase 2 (checkout integration). This is the most architecturally significant pitfall because it determines the entire order flow design.

**Confidence:** HIGH -- the exact same race condition already exists in the codebase between Stripe checkout and Asher Med patient lookup (lines 149-168 of the webhook handler).

---

### Pitfall 2: SiPhox Credit Balance Exhaustion with No Alerting

**What goes wrong:** CULTR pre-purchases SiPhox credits and the API deducts credits on each `POST /orders` call. The `GET /credits` endpoint returns the current balance, but nothing prevents a member from checking out with a blood test add-on when CULTR has zero credits remaining. The SiPhox order call fails, but the member has already paid Stripe. Now you have a paid order with no fulfillment capability and no automated way to know it happened.

**Why it happens:** Credit balances are checked on the SiPhox side, not the CULTR side. The checkout flow has no pre-check for available credits. Unlike payment failures (which Stripe handles), credit exhaustion is a business-logic failure that happens silently in a background webhook handler.

**Consequences:** Paid members don't receive kits. Support must manually reconcile. If multiple orders fail before anyone notices, you have a backlog of unhappy customers. Refund requests and chargebacks. Reputational damage for a health platform.

**Prevention:**
1. **Credit monitoring:** Build a `GET /api/admin/siphox/credits` route that calls `GET /credits` and caches the result. Display balance on admin dashboard.
2. **Low-credit alerting:** When credit balance drops below a threshold (e.g., 10 credits), send an admin email via Resend. Check balance after every successful order.
3. **Pre-order credit check:** Before creating a SiPhox order, call `GET /credits`. If insufficient, set the local order to `status: 'pending_credits'` and alert admin instead of silently failing.
4. **Graceful degradation:** If credits are exhausted, hide the blood test add-on from the Core checkout UI (or show "Currently Unavailable") rather than accepting payment for an undeliverable product.
5. **Never fail silently:** The existing webhook handler pattern uses `console.error` + continue (lines 271-274 in the Stripe webhook). For SiPhox failures, this is insufficient -- failed kit orders must be surfaced to admin, not just logged.

**Detection:** `siphox_orders WHERE status = 'failed_credits'` count > 0. Also: SiPhox credit balance < 5.

**Phase:** Phase 2 (checkout integration). Must be designed alongside the order flow, not bolted on later.

**Confidence:** HIGH -- the SiPhox API uses `purchase_with_attached_payment: false` (credits model confirmed in PROJECT.md). Every credit-based API system has this failure mode.

---

### Pitfall 3: Storing Raw Biomarker Values as PHI Without Encryption at Rest

**What goes wrong:** Biomarker results (blood glucose, testosterone levels, cholesterol values) are individually identifiable health information -- textbook PHI under HIPAA. The existing codebase stores data in Neon PostgreSQL via `@vercel/postgres`, which provides TLS in transit but does NOT automatically encrypt data at rest at the application level. Neon's infrastructure provides encryption at the storage layer, but HIPAA requires you to assess and document this -- not assume it. If you cache biomarker results in a local `biomarker_results` table with raw values and no column-level encryption, and that database is compromised, every member's blood work is exposed in plaintext.

**Why it happens:** Developers treat the database as a black box ("the cloud provider encrypts it"). The existing codebase already stores some health data (intake forms, physical measurements via Asher Med), but biomarker results are far more sensitive and voluminous (150+ data points per member per test).

**Consequences:** HIPAA breach notification required (if >500 individuals: notify OCR + media). Fines: $100-$50,000 per violation depending on tier. Loss of trust that is existential for a health platform.

**Prevention:**
1. **Minimize local storage:** Do NOT cache all 150+ biomarkers in your database. Fetch from SiPhox API on demand and cache in memory (React state) for the session only. Store only the SiPhox `customer_id` and `report_id` locally.
2. **If you must cache** (for trends/historical display): encrypt biomarker values at the application level before writing to DB. Use AES-256 with a separate encryption key stored in env vars (not the DB). Decrypt only when rendering for the authenticated member.
3. **Follow existing HIPAA patterns:** The codebase already has a "No PHI logging" pattern (see Stripe webhook handler: "All data stored is PHI-free"). Apply the same discipline. Never `console.log` biomarker values.
4. **Verify Neon encryption:** Neon Postgres encrypts data at rest with AES-256 at the storage layer. Document this in your HIPAA risk assessment. But do NOT rely on it as your only control -- defense in depth.
5. **Audit access:** Add a `biomarker_access_log` table that records which member's data was accessed, when, and by whom (member self-service vs. admin).

**Detection:** Search codebase for `console.log` or `console.error` near biomarker data. Check DB schema for unencrypted health value columns.

**Phase:** Phase 3 (results display). Must be designed before any biomarker data is written to the database.

**Confidence:** HIGH -- HIPAA enforcement actions for unencrypted PHI are well-documented. The 2025 HIPAA Security Rule update specifically calls out encryption requirements.

---

### Pitfall 4: Biomarker ID Mismatch Between SiPhox API and Local Resilience Engine

**What goes wrong:** The existing `lib/resilience.ts` defines biomarker IDs like `hs-crp`, `hba1c`, `fasting-glucose`, `total-testosterone`, `vitamin-d`, `tsh`, `dhea-s`. The SiPhox API returns biomarkers with its own naming scheme (from the SiPhox biomarkers list: "hsCRP", "A1C", "25-(OH) Vitamin D", "Free Testosterone", "TSH", "DHEA-S"). These are not the same strings. If you feed SiPhox data directly into `calculateResilienceScore()` without mapping, every `valueMap.get(definition.id)` lookup returns `undefined` and the resilience score is 0 with 0% data completeness. The dashboard shows "No Biomarker Data" even though the member has a complete blood panel.

**Why it happens:** Two independent systems (SiPhox API and the local resilience engine) use different naming conventions for the same biomarkers. Nobody builds the mapping table until integration testing, and by then the UI is built assuming the data flows through.

**Consequences:** Dashboard displays empty state or zero scores for members who have real data. Members lose trust in the platform. The existing `BiomarkerTrends` component renders "No Biomarker Data" (line 369-377 of `BiomarkerTrends.tsx`) for every member.

**Prevention:**
1. **Build the mapping table first:** Create `lib/config/siphox-biomarker-mapping.ts` that maps every SiPhox biomarker name to the local `resilience.ts` biomarker ID. This is the single most important configuration file for the integration.
2. **Use the SiPhox `GET /biomarkers` endpoint** to retrieve the canonical list of biomarker names/IDs. Map from SiPhox IDs, not display names (display names can change).
3. **Handle unmapped biomarkers gracefully:** If SiPhox returns a biomarker that has no local mapping, store it with a `category: 'uncategorized'` flag and display it in an "Additional Results" section, rather than silently dropping it.
4. **Unit test the mapping:** For every biomarker in `BIOMARKER_DEFINITIONS`, assert that a SiPhox mapping exists. For every biomarker in the SiPhox Longevity Essentials panel (listed in PROJECT.md), assert a local mapping exists. Run this test in CI.
5. **Category alignment:** The SiPhox categories ("Metabolic Health", "Nutritional", "Heart Health", "Hormonal Health", "Inflammation", "Thyroid Health") do NOT match the `resilience.ts` categories ("inflammation", "metabolic", "hormonal", "longevity", "oxidative", "mitochondrial"). You need a category mapping too, or the `BiomarkerTrends` component groups data incorrectly.

**Detection:** After first real integration test, check if `ResilienceScore.dataCompleteness` is >0%. If it's 0, the mapping is wrong.

**Phase:** Phase 3 (results display). Build and test the mapping before building any UI.

**Confidence:** HIGH -- this is a verified mismatch. The `resilience.ts` IDs and the SiPhox biomarker names from PROJECT.md use different conventions. Already confirmed by reading both files.

---

## Moderate Pitfalls

Mistakes that cause degraded UX, wasted development time, or data inconsistencies.

---

### Pitfall 5: Stripe Payment Links Cannot Support Optional Add-On Items

**What goes wrong:** The current checkout flow uses Stripe Payment Links (`plan.paymentLink` in `lib/config/plans.ts`). For Core tier, the blood test is a $135 optional add-on. Stripe Payment Links do NOT support optional items -- they are static, pre-configured URLs. You cannot dynamically add a one-time product to a subscription Payment Link. Attempting to hack around this (e.g., a separate Payment Link for the add-on) creates two separate Stripe transactions that are not linked, complicating fulfillment, refunds, and attribution.

**Why it happens:** The codebase was built with Payment Links for simplicity (the checkout route just returns a redirect URL). Adding optional items requires migrating to Stripe Checkout Sessions (server-side session creation with dynamic line items), which is a different architecture.

**Consequences:** Without migration: you cannot offer the $135 add-on at checkout. With a hacky workaround: you get two unlinked transactions per member, breaking the webhook handler's assumption of one checkout = one membership.

**Prevention:**
1. **Migrate Core checkout to Stripe Checkout Sessions** for the Core tier. Keep Payment Links for Catalyst+ and Concierge (where the kit is auto-included, no optional item needed).
2. **Use Stripe's optional items feature** on the Checkout Session: add the blood test as an `optional` line item with `adjustable_quantity: { enabled: true, minimum: 0, maximum: 1 }`.
3. **Alternatively, use a two-step approach:** Checkout with Payment Link for the subscription, then offer the blood test add-on on the post-checkout success page as a separate one-time purchase. Simpler but worse UX.
4. **Store the add-on decision in metadata:** Whether the member opted in to the blood test must be in the Stripe session metadata so the webhook handler knows to create a SiPhox order.
5. **Important constraint:** Stripe Checkout Sessions do not allow mixing recurring and one-time line items in `subscription` mode. The $135 add-on must be a one-time item, which means the session mode should be `subscription` with the recurring plan + an `invoice_creation` for the one-time item, OR use `payment` mode with a one-time charge that covers both (subscription created separately). Test this carefully.

**Detection:** Try to add `?line_items` to a Payment Link URL -- it won't work. Stripe docs confirm Payment Links don't support dynamic items.

**Phase:** Phase 2 (checkout integration). This is an architecture decision that must be made early because it determines the entire checkout flow.

**Confidence:** HIGH -- verified against Stripe documentation. The current codebase uses Payment Links (confirmed in `lib/config/plans.ts`).

---

### Pitfall 6: Kit Registration Fails Silently on Invalid or Already-Registered Kit IDs

**What goes wrong:** The SiPhox API has two relevant kit endpoints: `GET /kits/:kitID/validate` and `POST /kits/:kitID/register`. Common failure modes that are easy to miss:
- **Already registered:** Member enters a kit ID that was already registered (by them or a family member who received the same shipment).
- **Invalid format:** Kit IDs have a specific format (alphanumeric barcode). Users mistype, OCR fails, or they enter the wrong barcode from the packaging.
- **Expired kit:** Kits have a shelf life (typically 12 months from manufacture). SiPhox may reject registration for expired kits.
- **Kit not yet in system:** SiPhox may not have ingested the kit ID into their system yet if the shipment was very recent.

If the registration UI just shows a generic "Something went wrong" error for all of these, the member cannot self-service and files a support ticket.

**Why it happens:** Developers build the happy path (enter ID, register, show confirmation) and handle all errors with a single catch block. The SiPhox validate endpoint returns specific error states that should be surfaced differently.

**Consequences:** High support ticket volume. Members get frustrated with barcode entry. Some members give up and never register their kit, wasting the credit that was used to order it.

**Prevention:**
1. **Call validate before register:** Use `GET /kits/:kitID/validate` first. Parse the response to determine: is the kit ID recognized? Is it already registered? Is it expired? Is it associated with the correct customer?
2. **Specific error messages:** Map each validation failure to a user-friendly message:
   - "This kit ID was not found. Please check the barcode on your kit and try again."
   - "This kit has already been registered. If you believe this is an error, contact support."
   - "This kit has expired. Please contact support for a replacement."
3. **Input assistance:** Add input masking or format hints. If SiPhox kit IDs follow a pattern (e.g., `KIT-XXXX-XXXX`), enforce that format client-side.
4. **Retry guidance:** If the kit was just delivered and isn't in the system yet, tell the member: "Your kit may take up to 24 hours to activate after delivery. Please try again tomorrow."
5. **Photo scan option (future):** Consider adding barcode scanning via camera as a stretch feature to reduce typos.

**Detection:** Monitor registration API call failure rate. If >10% of registration attempts fail, the UX needs improvement.

**Phase:** Phase 4 (kit registration UI). Build validation flow before the registration form.

**Confidence:** MEDIUM -- specific SiPhox error responses for validation are inferred from the API shape (`GET /kits/:kitID/validate` implies validation logic) and analogous platforms (23andMe, Everlywell). Exact error payloads need to be confirmed with a test API call.

---

### Pitfall 7: Polling for Report Completion Instead of Handling the Full Lifecycle

**What goes wrong:** After a member mails their blood sample, SiPhox processes it and generates a report. The API has `GET /customers/:id/reports/:reportID` to retrieve results, but there is no obvious webhook for "report ready" in the API surface listed in PROJECT.md. Developers tend to solve this with polling: a cron job that calls the reports endpoint every hour for every pending kit. This is wasteful, slow (member waits up to an hour to see results), and scales poorly (100 members = 100 API calls per hour, 2400/day).

**Why it happens:** The SiPhox API surface in PROJECT.md does not list a webhook/callback mechanism. Without webhooks, polling feels like the only option. Developers don't ask SiPhox about webhooks during integration planning and discover this gap after building the polling system.

**Consequences:** Wasted API calls. Delayed results visibility (minutes to hours depending on poll interval). Rate limiting risk if CULTR scales. Poor UX compared to competitors who show results "instantly" (because they use webhooks or push notifications).

**Prevention:**
1. **Ask SiPhox about webhooks first:** Before writing any polling code, confirm with SiPhox whether they support webhook notifications for report completion. Many partner APIs have undocumented webhook support for enterprise partners.
2. **If no webhooks available:** Use smart polling with exponential backoff. Don't poll every pending kit every hour. Instead:
   - Kits registered < 3 days ago: don't poll (too early for results)
   - Kits registered 3-10 days ago: poll once every 6 hours
   - Kits registered 10-14 days ago: poll once every 2 hours (results most likely)
   - Kits registered > 14 days ago: poll once daily (flag as delayed, alert admin)
3. **Cache report status locally:** Store last poll time and status in `siphox_orders` table. Don't re-poll if status hasn't changed.
4. **Member-triggered refresh:** Add a "Check for Results" button in the dashboard that calls the SiPhox API on demand. This reduces polling load and gives the member agency.
5. **Email notification:** When results are detected via polling, send an email: "Your blood test results are ready! Log in to your CULTR dashboard to view them."
6. **Consider `POST /customer/add_data` and `GET /customer/add_data/jobs/:id`:** These endpoints suggest SiPhox has async job processing. The `jobs/:id` endpoint implies a polling pattern for data ingestion jobs. Align your polling strategy with their expected processing times.

**Detection:** Monitor SiPhox API call volume. If >50% of calls are report checks that return "not ready," polling is too aggressive.

**Phase:** Phase 3 (results fetching). Design the polling/webhook strategy before building the results display UI.

**Confidence:** MEDIUM -- the SiPhox API surface from PROJECT.md does not explicitly mention webhooks. This needs to be confirmed directly with SiPhox.

---

### Pitfall 8: Displaying 150+ Biomarkers with Missing/Partial Data Creates a Wall of "N/A"

**What goes wrong:** PROJECT.md specifies "N/A display for biomarkers with no data returned" and "~150+ biomarkers organized by category." If a member's Longevity Essentials panel returns ~30 biomarkers but you render all 150+ with N/A for the missing 120+, the dashboard becomes an overwhelming wall of grey "N/A" cards. The useful data is buried. The member's first impression is "most of my results are missing" rather than "here are my 30 results."

**Why it happens:** The design spec says "show all possible biomarkers with N/A when no data" which sounds correct in theory (member knows what's available) but fails in practice because the ratio of N/A to real data is 4:1 or worse.

**Consequences:** Members perceive the dashboard as broken or incomplete. They don't scroll to find their actual results. They think they paid for 150+ tests but only "got" 30. Support gets "where are my results?" tickets.

**Prevention:**
1. **Two-tier display:** Show results-with-data prominently in the main view. Show available-but-no-data biomarkers in a collapsible "Additional Tests Available" section at the bottom.
2. **Category-first navigation:** Group by SiPhox categories (Metabolic, Heart, Hormonal, etc.). Only show categories that have at least one result. Empty categories go in the "Available in Extended Panel" section.
3. **Progress indicator:** "Your panel tested 28 of 150+ available biomarkers. Upgrade to the Extended Panel for comprehensive coverage." This reframes N/A as an upsell, not a failure.
4. **Empty state per category:** If a category has zero results, show a single card: "No [Hormonal Health] markers in your current panel" rather than 12 individual N/A cards.
5. **The existing `BiomarkerTrends` component already filters:** Line 409 of `BiomarkerTrends.tsx` does `.filter(([_, biomarkers]) => biomarkers.length > 0)` -- it only renders categories with data. Extend this pattern to the full labs dashboard.

**Detection:** User testing. Show a prototype to 3 people and ask "what do you think of your results?" If they say "most of it is N/A," the layout is wrong.

**Phase:** Phase 4 (labs dashboard UI). This is a UX design decision, not just a data problem.

**Confidence:** HIGH -- verified that the existing `BiomarkerTrends.tsx` already handles the empty state pattern, but the spec calls for showing N/A which conflicts with good UX.

---

### Pitfall 9: GA4 Tracking on Labs Dashboard Exposes Biomarker PHI

**What goes wrong:** The existing PITFALLS.md from the portal research (2026-03-10) already identified this: GA4 is loaded globally in `app/layout.tsx` and will fire on authenticated pages. For the labs dashboard specifically, the risk is worse because:
- URL paths may contain biomarker category names (e.g., `/dashboard/labs/hormonal-health`)
- Page titles may include result summaries
- Custom GA4 events (if added for analytics) could contain biomarker values
- Google does not sign BAAs for Analytics

**Why it happens:** This was already identified as Pitfall 1 in the portal research but bears repeating for this milestone because the labs dashboard introduces the highest-sensitivity PHI in the entire application.

**Consequences:** HIPAA violation. Same as previous research: OCR investigation, breach notification, fines.

**Prevention:**
1. The portal research already prescribed the fix: exclude GA4 from all authenticated routes.
2. For the labs dashboard specifically: ensure that no biomarker values, names, or result statuses appear in any analytics event, page title, or URL parameter.
3. If you need analytics on the labs feature (e.g., "how many members view their results"), use a HIPAA-compliant analytics service or track only anonymized, aggregate metrics server-side.

**Detection:** Same as portal research: audit network requests from labs pages in DevTools for Google Analytics calls.

**Phase:** Must be resolved before Phase 4 (labs dashboard). Dependency on Phase 1 of the portal milestone (which should have already addressed this).

**Confidence:** HIGH -- this is a reiteration of a verified pitfall from prior research.

---

### Pitfall 10: Checkout Add-On Creates Orphaned SiPhox Order When Subscription is Refunded

**What goes wrong:** Member checks out Core ($199/mo) + Blood Test ($135 add-on). Stripe processes both charges. The webhook creates a SiPhox order (consuming a credit). The member requests a refund within 24 hours. Stripe refunds the subscription and the add-on payment. But the SiPhox credit is already consumed -- credits are not refundable via API. You now have: a consumed SiPhox credit, a shipped or shipping kit, no payment from the member, and no automated way to recoup the loss.

**Why it happens:** The existing codebase handles refunds via `charge.refunded` webhook (line 107 in the Stripe webhook handler), which reverses creator commissions. But there is no SiPhox-side reversal because SiPhox credits are consumed on order creation, not on kit shipment.

**Consequences:** Financial loss ($135 in member-facing price + the wholesale credit cost). If this happens frequently (e.g., buyer's remorse within 24 hours), it becomes a significant cost center. The kit is wasted.

**Prevention:**
1. **Delay SiPhox order creation:** Do not create the SiPhox order immediately on checkout. Wait 24-48 hours (refund window) before consuming the credit. Store as `status: 'pending_fulfillment'` locally.
2. **On refund webhook:** If the order is still `pending_fulfillment`, mark it as `cancelled` and do NOT create the SiPhox order. No credit consumed, no kit shipped.
3. **If kit already shipped:** Accept the loss but flag it. Consider a "restocking" policy where the member must return the unopened kit.
4. **Refund policy clarity:** On the checkout page, state "Blood test kits are non-refundable once shipped" to reduce refund requests.
5. **Align with existing refund flow:** The `handleChargeRefunded` function already looks up orders by `payment_intent`. Extend this to check for and cancel pending SiPhox orders.

**Detection:** `siphox_orders WHERE status = 'ordered' AND EXISTS (SELECT 1 FROM orders WHERE stripe_payment_intent_id = ... AND status = 'refunded')`. Any rows = credits wasted on refunded orders.

**Phase:** Phase 2 (checkout integration). The delayed fulfillment pattern must be designed into the order flow from the start.

**Confidence:** HIGH -- this is a direct consequence of the credits model and the existing refund handling pattern in the codebase.

---

## Minor Pitfalls

Mistakes that cause confusion, tech debt, or minor UX issues.

---

### Pitfall 11: SiPhox `external_id` Not Set During Customer Creation

**What goes wrong:** The SiPhox `CreateOrderRequest` has an `external_id` field on the `recipient` object. If you don't set this to the CULTR member's internal ID (or portal phone number, or some unique identifier), you lose the ability to look up SiPhox customers by your own identifier. You're stuck querying `GET /customers` with email matching, which is fragile (members change emails, emails have case sensitivity issues).

**Prevention:** Always set `external_id` to a stable CULTR identifier (e.g., the `portal_sessions.phone_e164` or the `memberships.id`). Use this as the primary lookup key, with email as fallback. Document which identifier is used in the SiPhox mapping.

**Phase:** Phase 1 (API client). Set `external_id` from the first API call.

**Confidence:** HIGH -- `external_id` is documented in the SiPhox API schema in PROJECT.md.

---

### Pitfall 12: Biomarker Unit Mismatch Between SiPhox and Resilience Engine

**What goes wrong:** The `resilience.ts` file defines units like `mg/L`, `mg/dL`, `ng/dL`, `mIU/L`, `ng/mL`, `%`, `μIU/mL`. SiPhox may return the same biomarker in different units (e.g., testosterone in `nmol/L` instead of `ng/dL`). A 500 ng/dL testosterone value is optimal, but if SiPhox returns 17.3 nmol/L (the same value in different units) and the resilience engine interprets it as 17.3 ng/dL, the score says "critical" when the value is actually perfect.

**Prevention:**
1. Include unit information in the biomarker mapping table.
2. Build unit conversion functions for common lab unit pairs (ng/dL <-> nmol/L, mg/L <-> mg/dL, etc.).
3. Validate units on every SiPhox response before feeding into the resilience engine.
4. Log a warning if an unexpected unit is received.

**Phase:** Phase 3 (results display). Must be handled in the data transformation layer.

**Confidence:** MEDIUM -- unit conventions vary across lab providers. Need to verify SiPhox's specific unit conventions with a test report.

---

### Pitfall 13: `is_test_order` Flag Left Enabled in Production

**What goes wrong:** The SiPhox `CreateOrderRequest` has an `is_test_order: boolean` field. During development, this is set to `true` to avoid consuming real credits. If this flag is not tied to the environment (staging vs. production) via an env var check, test orders will accidentally be created in production (wasting credits) or real orders will be created in staging (also wasting credits, and shipping kits to test addresses).

**Prevention:**
1. Derive `is_test_order` from `process.env.SIPHOX_ENVIRONMENT` or `process.env.NODE_ENV`.
2. Follow the existing pattern from Asher Med: `ASHER_MED_ENVIRONMENT` env var controls sandbox vs. production.
3. Add a similar `SIPHOX_ENVIRONMENT` env var. Set `is_test_order: SIPHOX_ENVIRONMENT !== 'production'`.
4. Log the value of `is_test_order` on every order creation (not the credit cost, just the flag) so you can audit.

**Phase:** Phase 1 (API client). Bake environment awareness into the client from day one.

**Confidence:** HIGH -- the codebase already uses this pattern for Asher Med, Affirm, and Klarna (all have sandbox toggles).

---

### Pitfall 14: Member Tier Downgrade After Kit Is Ordered

**What goes wrong:** A Catalyst+ member's subscription includes a blood test kit. The kit is ordered via SiPhox when they check out. The member then downgrades to Core tier (which does NOT include the kit). The kit is already in transit. The member registers the kit, sends the sample, and gets results -- all on a tier that doesn't include blood testing. Meanwhile, no $135 add-on charge was collected because the member was on Catalyst+ when they ordered.

**Prevention:**
1. **Kit is a one-time perk of checkout, not an ongoing entitlement.** Once the kit is ordered, the member keeps it regardless of tier changes. This is the simplest approach.
2. **Do not gate results display by tier.** If a member has a SiPhox report, show it -- even if they downgraded. The blood was drawn, the credit was consumed, the results exist.
3. **Future kit orders should check current tier.** If the member wants another kit later, check their current tier at that point. Don't rely on what tier they were on when they first subscribed.
4. **Document this policy** for support: "Blood test kits are included once per Catalyst+/Concierge enrollment. Downgrading does not affect existing kit orders or results."

**Phase:** Phase 2 (checkout integration) for the ordering logic. Phase 4 (labs dashboard) for the display logic.

**Confidence:** HIGH -- the existing subscription lifecycle in the webhook handler already handles downgrades (`handleSubscriptionUpdated`). The SiPhox integration must be resilient to these events.

---

### Pitfall 15: Duplicate SiPhox Customers from Idempotency Failures

**What goes wrong:** The Stripe webhook handler has idempotency checks (`isStripeEventProcessed` / `recordStripeEvent`). But if the SiPhox customer creation call is inside the webhook handler and the handler succeeds at creating the SiPhox customer but fails _after_ that (e.g., the SiPhox order call fails), Stripe retries the webhook. The retry creates a _second_ SiPhox customer for the same member. Now you have duplicate customers in SiPhox, reports split across two customer IDs, and the member sees incomplete data.

**Prevention:**
1. **Check for existing SiPhox customer before creating:** Use `GET /customers` with the member's email or `external_id` before calling `POST /customer`. If a customer already exists, use their ID.
2. **Store SiPhox customer ID locally:** After successful creation, save `siphox_customer_id` in the local `memberships` or `siphox_orders` table. On retry, check local DB first.
3. **Make customer creation idempotent:** Use `external_id` as a unique key. If SiPhox supports upsert-like behavior (create or return existing), use that pattern.
4. **Separate customer creation from order creation:** Create the SiPhox customer during intake/registration (not in the webhook). Create the order in the webhook. This way the customer already exists when the webhook fires.

**Phase:** Phase 1 (API client) for idempotent customer creation. Phase 2 (checkout) for the ordering flow.

**Confidence:** HIGH -- the existing codebase explicitly handles Stripe webhook idempotency (lines 72-76 of the webhook handler), proving this is a known concern. SiPhox calls within the webhook inherit the same retry risks.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| API client setup | Test orders in production (Pitfall 13) | Environment-aware `is_test_order` flag from day one |
| API client setup | Missing `external_id` (Pitfall 11) | Set external_id on first customer creation |
| API client setup | Duplicate customers on retry (Pitfall 15) | Idempotent customer creation with local cache |
| Checkout integration | Payment Link can't support add-ons (Pitfall 5) | Migrate Core to Checkout Sessions |
| Checkout integration | Race condition on customer creation (Pitfall 1) | Deferred order pattern with address trigger |
| Checkout integration | Credit exhaustion (Pitfall 2) | Pre-order credit check + admin alerting |
| Checkout integration | Refund orphans SiPhox order (Pitfall 10) | Delayed fulfillment with refund window |
| Checkout integration | Tier downgrade after kit order (Pitfall 14) | Kit is one-time perk, not ongoing entitlement |
| Results display | Biomarker ID mismatch (Pitfall 4) | Mapping table with unit tests, built before UI |
| Results display | Unit mismatch (Pitfall 12) | Unit conversion layer in data transform |
| Results display | PHI in database (Pitfall 3) | Minimal local storage, encrypt if caching |
| Results display | Report polling overhead (Pitfall 7) | Smart polling with exponential backoff |
| Labs dashboard UI | Wall of N/A (Pitfall 8) | Two-tier display: results first, available tests collapsed |
| Labs dashboard UI | GA4 on labs pages (Pitfall 9) | Exclude GA4 from authenticated routes |
| Kit registration | Silent registration failures (Pitfall 6) | Validate before register, specific error messages |

---

## Sources

- Stripe Checkout optional items documentation: [Configure optional items](https://docs.stripe.com/payments/checkout/optional-items)
- HIPAA encryption requirements: [HIPAA Encryption Requirements 2025](https://www.keragon.com/hipaa/hipaa-explained/hipaa-encryption-requirements), [PHI Database Encryption Guide](https://www.hipaavault.com/resources/phi-database-encryption-implementation-guide/)
- HIPAA compliance for APIs: [HIPAA Compliance for APIs Guide](https://intuitionlabs.ai/articles/hipaa-compliant-api-guide)
- Webhook race conditions: [Billing Webhook Race Condition Solution Guide](https://excessivecoding.com/blog/billing-webhook-race-condition-solution-guide), [Stripe Webhooks Race Conditions](https://www.pedroalonso.net/blog/stripe-webhooks-solving-race-conditions/)
- Webhook ordering: [You Can't Guarantee Webhook Ordering](https://hackernoon.com/you-cant-guarantee-webhook-ordering-heres-why)
- Kit registration edge cases: [23andMe Registration Trouble](https://customercare.23andme.com/hc/en-us/articles/204632060-23andMe-Registration-Trouble), [Quest Home Collection FAQ](https://www.questhealth.com/faqs/home-collection-kits.html)
- Lab results partial data: [Junction API Partial Result Notifications](https://docs.junction.com/lab/workflow/partials)
- SiPhox Health partner info: [Partner With Us](https://siphoxhealth.com/partner)
- SiPhox API schemas: verified from PROJECT.md (internal documentation)
- Existing codebase patterns: verified from `app/api/webhook/stripe/route.ts`, `lib/resilience.ts`, `lib/auth.ts`, `lib/asher-med-api.ts`, `components/dashboard/BiomarkerTrends.tsx`
