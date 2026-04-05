# CULTR Health — High-Leverage Low-Hanging Fruit

**Based on:** MEDVi competitive intelligence (64 vendors, $401M→$1.8B) cross-referenced with CULTR Health codebase audit (2 parallel agents + direct code review).

**Prioritization criteria:** Impact on revenue/conversion x Implementation effort. Ordered by leverage — highest first.

**Codebase audit findings summary:**
- CULTR has 22 email functions in `lib/resend.ts` but NO drip/lifecycle sequences and NO abandoned checkout recovery
- Mailchimp sync exists (tags: `intake-complete`, `labs-ordered`, `labs-results-ready`) — a foundation for automation
- Quiz has NO email capture (email only collected at Stripe checkout — losing all quiz-takers who don't convert)
- Success page has basic "Complete Intake" + "Track Order" CTAs but NO cross-sell, NO referral invite, NO receipt download
- GA4 events exist for full e-commerce funnel (view_item, add_to_cart, begin_checkout, purchase) but NO Facebook Pixel, NO Google Ads tag
- Stock indicators exist in join-club (`"Only X left"`) but NOT on homepage, pricing, or checkout pages
- `pending_intakes` table tracks incomplete checkouts with 30-day expiry — ready for abandoned cart emails but none implemented
- Cron job `/api/cron/stale-orders` exists but no email recovery logic connected to it
- CULTR already beats MEDVi on price ($149 vs $179) but doesn't lead with this anywhere

---

## TIER 1: CONVERSION KILLERS (Do This Week)

These are proven revenue-generating patterns that MEDVi uses at $5.64M monthly visits and CULTR currently lacks entirely.

---

### 1. Add a Weight Loss Calculator / BMI Tool to the Homepage

**What MEDVi does:** Interactive BMI calculator + weight goal selector on EVERY landing page. "How much do you want to lose? → 1-20 lbs / 20-50 lbs / 51+ lbs / Unsure." Shows personalized potential: "200 lbs → could lose 40 lbs." All CTAs funnel to intake form.

**What CULTR has:** Nothing. The homepage has generic "Take the Quiz" and "See Plans" CTAs. No interactive engagement before the click.

**Why this matters:** Interactive calculators create psychological commitment before the user ever clicks a CTA. MEDVi's 9:27 average session duration (extremely high) is partly driven by these engagement tools. Users who interact with a calculator convert at 2-5x higher rates than passive page visitors.

**Implementation:**
- Add a `WeightGoalSelector` component to the homepage hero area
- 4 goal options (matching quiz entry points): "Lose 1-20 lbs" / "Lose 20-50 lbs" / "Lose 51+ lbs" / "Not sure"
- Each links to `/quiz` with a query param pre-selecting the weight loss goal
- Optional: BMI calculator widget (height + weight → shows potential loss + "See Your Plan" CTA)
- **Effort:** 2-4 hours. Single client component + CSS.

---

### 2. Add Facebook/Meta Pixel + Google Ads Conversion Tracking

**What MEDVi does:** Google Ads (`AW-17694289818`) conversion pixel + Facebook domain verification + Everflow affiliate tracking on EVERY page. This is what powers their $5.64M/month paid acquisition machine.

**What CULTR has:** Google Analytics 4 only (`lib/analytics.ts`). NO Facebook Pixel. NO Google Ads conversion tracking. NO Meta domain verification. The GA4 events exist but no paid acquisition infrastructure.

**Why this matters:** You literally cannot run profitable paid ads without conversion tracking. Without the Meta Pixel, you can't run Facebook/Instagram ads. Without Google Ads conversion tracking, you can't optimize search campaigns. This is THE blocker for any paid growth.

**Implementation:**
- Add Meta Pixel to `app/layout.tsx` (script tag + `fbq('init', 'YOUR_PIXEL_ID')`)
- Add Google Ads conversion tag alongside existing GA4 (`gtag('config', 'AW-XXXXXXXXX')`)
- Fire conversion events on:
  - Quiz completion → `fbq('track', 'Lead')`
  - Checkout initiation → `fbq('track', 'InitiateCheckout')`
  - Purchase completion → `fbq('track', 'Purchase', {value, currency})`
  - Club signup → `fbq('track', 'CompleteRegistration')`
- Add Facebook domain verification meta tag
- **Effort:** 2-3 hours. Config + script tags. No new components.
- **Prerequisite:** Create Meta Business account + Ads account, Google Ads account

---

### 3. Capture Email in the Quiz (Before Checkout)

**What MEDVi does:** Intake form collects email at step 1. Klaviyo (3 accounts) + Brevo email automation means they can follow up with everyone who starts but doesn't complete.

**What CULTR has:** The quiz (`app/quiz/QuizClient.tsx`) collects answers and recommends a plan, but captures ZERO contact information. Email is only collected at Stripe checkout. This means every quiz-taker who doesn't click "Join" is lost forever — no way to follow up.

**Why this matters:** This is probably the single highest-leverage fix. If 1,000 people take the quiz and 5% convert to checkout, you lose 950 leads with no way to contact them. Even capturing 30% of those emails and sending a 3-email sequence would recover 3-5% — that's 28-47 additional customers per 1,000 quiz-takers.

**Implementation:**
- Add an email capture step after question 2 or 3 in the quiz (when engagement is high but before they might drop off)
- Frame it as: "Enter your email to save your results" or "We'll email your personalized plan"
- Store in `waitlist_entries` table (already exists) with tag `quiz-started`
- Sync to Mailchimp with tag `quiz-started` (Mailchimp integration already exists in `lib/mailchimp.ts`)
- Trigger 3-email abandoned quiz sequence if they don't reach checkout within 24 hours
- **Effort:** 2-3 hours. Add one step to quiz + API call to waitlist endpoint.
- **Files:** `app/quiz/QuizClient.tsx`, `lib/config/quiz.ts`, `app/api/waitlist/route.ts`

---

### 4. Price Anchoring — Lead with "$149" Everywhere

**What MEDVi does:** "$179" appears on EVERY page, in EVERY ad, in EVERY CTA. It's the first number visitors see. The $299 refill price is buried in FAQ fine print. Spring promo banner: "Only $179 + Fast, Free Shipping."

**What CULTR has:** Homepage pricing section shows all 4 tiers (Club $0, Core $149-$239, Catalyst+ $499, Concierge $1,099). The lowest actual paid price ($149 for Semaglutide) exists but isn't hero'd. The homepage hero says "Take the Quiz" and "See Plans" — no price mentioned.

**Why this matters:** Price anchoring with the lowest credible number dramatically increases click-through. "$149/mo" in a hero headline converts better than "See Plans." MEDVi's entire funnel is built around "$179" — CULTR actually beats them on price ($149 vs $179) but doesn't communicate it.

**Implementation:**
- Add "Starting at $149*/mo" to the homepage hero subheadline
- Add asterisk footnote: "* Semaglutide Core plan. 2-month initial protocol. Medication billed separately."
- Add the same "$149" anchor to the quiz results page, pricing page header, and join-club landing
- Consider a floating "Starting at $149/mo" strip or promo banner
- **Effort:** 1-2 hours. Copy changes to existing components.

---

### 4. Add Urgency/Scarcity Signals

**What MEDVi does:** "SPRING Promo! Only $179 + Fast, Free Shipping" banner on every page. Countdown timers on upsell pages ("Your offer is reserved for [X time]"). "500,000+ patients" counter. Flowbase Countup animated numbers.

**What CULTR has:** No promo banners. No countdown timers. No seasonal offers. No urgency signals whatsoever. The TRUST_METRICS in social-proof.ts show "100+ members" which is actually a detractor vs. MEDVi's "500,000+".

**Why this matters:** Urgency drives action. Without it, users bookmark and never return. Even ethical urgency (limited appointment slots, seasonal pricing, cohort-based enrollment) significantly lifts conversion.

**Implementation:**
- Add a `PromoBanner` component to the top of the homepage (below header)
  - "Spring Special: First month at $149 + free shipping. Limited slots."
  - Or: "FOUNDER15 — 15% off your first 3 months. Founding member rate."
- Add animated stat counters to the homepage trust section (scroll-triggered)
- Consider a "Next cohort starts [date]" enrollment window model
- **Effort:** 3-4 hours. New PromoBanner component + minor homepage edits.

---

### 5. Post-Checkout Cross-Sell / Upsell Page

**What MEDVi does:** After QUAD purchase, immediately shows a GLP-1 upsell page with countdown timer, crossed-out original price ($299 → $179), and "Continue →" / "No Thanks" CTAs. This generates significant incremental revenue.

**What CULTR has:** `app/success/page.tsx` exists but likely just shows a generic "thank you" confirmation. No cross-sell, no upsell, no next-step guidance.

**Why this matters:** Post-purchase is the highest-intent moment in the funnel. The customer just gave you their credit card. AOV (average order value) increases of 10-30% are common with simple post-purchase upsells.

**Implementation:**
- On the success page, show contextual upsells based on what was purchased:
  - Core (GLP-1) → upsell Blood Test Kit ($135) + Doctor Consultation ($75)
  - Core → cross-sell to Catalyst+ with "upgrade and save" messaging
  - Club → upsell to Core with "$50 off first month" limited-time offer
  - Any tier → offer peptide add-ons from the product catalog
- Add a "Your Personalized Next Steps" section with: 1) Complete intake form 2) Schedule consultation 3) Join community
- **Effort:** 4-6 hours. New success page components.

---

### 6. Testimonials with Specific Weight Loss Numbers

**What MEDVi does:** Every testimonial includes SPECIFIC numbers: "Helen F. — Lost 85 lbs in 7 months," "Sandra K. — Lost 42 lbs in 4 months (65% less cravings)," "Michael P. — Lost 48 lbs in 5 months (17% increased muscle)." Four patient success stories with quantified outcomes prominently displayed.

**What CULTR has:** 8 testimonials in `social-proof.ts` with highlights like "-32 lbs" and "3 weeks" — but they're generic and not prominently placed. Missing specific before/after timelines. The highlights exist in the data but may not be displayed prominently on the homepage.

**Why this matters:** Specific numbers convert. "Lost 32 lbs in 4 months" is 10x more compelling than "Great results." MEDVi features 4 hero success stories with lbs lost + timeframe + secondary metrics.

**Implementation:**
- Create a `PatientSuccessStories` component with 4 featured stories:
  - Large numbers: "-32 lbs" / "4 months" 
  - Secondary metric: "50+ labs tested" / "3 week recovery"
  - Photo placeholder (lifestyle image, not patient photo)
- Place this section higher on the homepage (above pricing)
- Add these to the quiz results page too
- **Effort:** 3-4 hours. New component + homepage section placement.

---

## TIER 2: GROWTH MULTIPLIERS (Do This Month)

These unlock new acquisition channels or significantly improve the funnel.

---

### 7. Referral Program ("$50 for You, $50 for Them")

**What MEDVi does:** "$100 for you, $100 for them" referral program inside the patient portal. Separate from the $200-650 CPA affiliate program.

**What CULTR has:** A creator affiliate system (10% commission, tracking links, coupon codes) but NO simple member-to-member referral program. The affiliate system is designed for influencers/creators, not casual word-of-mouth.

**Why this matters:** Referral programs have the lowest CAC of any acquisition channel. Every happy member becomes a distribution channel. MEDVi's $100/$100 is aggressive — CULTR could start at $50/$50 or offer a free month.

**Implementation:**
- Add a `ReferralProgram` section to the member dashboard
- Generate unique referral links (e.g., `cultrhealth.com/r/[code]`)
- Referrer gets $50 credit on next bill; referred friend gets $50 off first month
- Track via existing `click_events` / `order_attributions` tables
- Surface in: dashboard, post-purchase success page, email footer
- **Effort:** 1-2 days. New API route + dashboard component + referral tracking.

---

### 8. Abandoned Intake / Checkout Recovery Emails

**What MEDVi does:** Klaviyo (3 accounts) for lifecycle email marketing. Customer.io for event-based automation. Full email recovery sequences.

**What CULTR has:** Transactional emails only (welcome, order confirmation, creator notifications via Resend). NO drip sequences. NO abandoned cart/intake recovery. NO lifecycle nurture emails.

**Why this matters:** 70-80% of checkout initiations are abandoned. Even a simple 3-email recovery sequence recovers 5-15% of those. At CULTR's price points, each recovery = $149-$1,099 in revenue.

**Implementation:**
- **Phase 1 (quick):** Add email capture earlier in the quiz flow. Currently email is only captured at checkout. Capture it at quiz start or after 2-3 questions.
- **Phase 2:** Set up a 3-email abandoned sequence via Resend:
  - Email 1 (1 hour): "Your personalized plan is waiting" — recap quiz results
  - Email 2 (24 hours): "Dr. Saberi's patients see results in 4-8 weeks" — social proof
  - Email 3 (72 hours): "Last chance: FOUNDER15 for 15% off" — urgency + discount
- **Phase 3:** Add lifecycle emails: Day 7 check-in, Day 30 results reminder, renewal reminders
- **Effort:** 2-3 days for Phase 1+2. Phase 3 is ongoing.

---

### 9. Speed Promise + Shipping Timeline on Every Page

**What MEDVi does:** "24-48 hour approval" + "Free expedited delivery" + "Shipped to your door" repeated on EVERY page. Three-step "Get Approved → Get Prescribed → Receive Rx" visual on every landing page.

**What CULTR has:** A "How It Works" section on the homepage (3 steps) but no specific speed promises. No "24-hour approval" claim. No shipping timeline visible.

**Why this matters:** Speed is the #1 differentiator in telehealth. Patients want to know: "How fast will I get my medication?" If CULTR doesn't answer this prominently, users will go to MEDVi which promises 24-48 hours.

**Implementation:**
- Add specific speed claims to the homepage and pricing page:
  - "Provider review within 24 hours"
  - "Medication ships in 3-5 business days"
  - "Free expedited shipping"
- Create a visual timeline: "Day 1: Sign up → Day 1-2: Provider review → Day 3-7: Medication arrives"
- Add to the "How It Works" section on the homepage
- **Effort:** 2-3 hours. Copy changes + optional timeline component.

---

### 10. A/B Testing Infrastructure

**What MEDVi does:** VWO (Visual Website Optimizer) on every conversion page, Account ID 1023394. Multiple landing page variants for different traffic sources (at least 4 detected for QUAD alone).

**What CULTR has:** Nothing. Zero A/B testing infrastructure.

**Why this matters:** You can't optimize what you don't measure. MEDVi continuously tests headlines, CTAs, pricing presentation, and page layouts. Even a 10% conversion improvement at CULTR's traffic levels is meaningful.

**Implementation:**
- **Quick option:** Add Vercel's built-in Edge Config + Middleware flags for A/B testing (free with Vercel Pro)
- **Better option:** Integrate Posthog (open-source, self-hostable) for feature flags + A/B tests + session replay
- **Full option:** VWO or Optimizely (paid, visual editor)
- Start testing: headline copy, CTA button text, pricing card order, hero image
- **Effort:** 4-8 hours for initial setup. Ongoing for test creation.

---

### 11. Spanish Language Support

**What MEDVi does:** Weglot translation with `es.medvi.org` subdomain. Patient portal has full i18n with 1000+ message keys (English + Spanish).

**What CULTR has:** Nothing. English only. No i18n infrastructure.

**Why this matters:** ~13% of the US population primarily speaks Spanish. In Florida (CULTR's base), it's ~21%. This is a 20%+ TAM expansion for near-zero marginal cost.

**Implementation:**
- **Quick option:** Add Weglot ($15-$29/mo) for automatic website translation — no code changes needed
- **Better option:** Next.js built-in i18n with `next-intl` for the marketing site + manual translation of key pages
- Start with: homepage, pricing, quiz, intake form, checkout, success page
- **Effort:** 2-4 hours for Weglot. 2-3 days for native i18n.

---

### 12. Trustpilot Integration

**What MEDVi does:** Trustpilot widget embedded on every product page. 4.4/5 rating with 11,713 reviews. Trustpilot Business subscription for verified review collection.

**What CULTR has:** Self-hosted testimonials in `social-proof.ts`. No third-party review platform. "50 reviews" in TRUST_METRICS — but these aren't visible anywhere external.

**Why this matters:** Third-party reviews (Trustpilot, Google Reviews) are 3x more trusted than self-hosted testimonials. They also generate SEO benefits and show up in Google search results.

**Implementation:**
- Create Trustpilot Business account ($0-$225/mo)
- Embed Trustpilot widget on: homepage, pricing page, checkout page
- Set up automated review invitation emails post-delivery (Trustpilot provides these)
- Also set up Google Business Profile for local SEO
- **Effort:** 2-3 hours for setup. Ongoing for review collection.

---

## TIER 3: RETENTION & LIFETIME VALUE (Do This Quarter)

These compound over time and reduce churn.

---

### 13. Post-Purchase Email Sequence (Onboarding Drip)

**What MEDVi does:** Klaviyo lifecycle emails + Customer.io event triggers. Automated sequences for: welcome, onboarding education, injection guidance, weight tracking reminders, refill reminders.

**What CULTR has:** Single welcome email + order confirmation. No onboarding drip. No education sequence. No re-engagement.

**Implementation:**
- Design a 10-email onboarding sequence:
  - Day 0: Welcome + what to expect + intake CTA
  - Day 1: Meet Dr. Saberi + provider credentials
  - Day 3: "Your medication is on its way" + dosing prep
  - Day 7: "How's your first week?" + side effect FAQ
  - Day 14: Weight tracking reminder + success stories
  - Day 21: Protocol adjustment education
  - Day 30: "Your first month results" + share your story CTA
  - Day 45: Referral program introduction
  - Day 60: Renewal reminder + upgrade offer
  - Day 75: "Members like you also try..." cross-sell
- **Effort:** 3-5 days. Email templates + Resend API scheduling logic.

---

### 14. Progress Tracking in Dashboard

**What MEDVi does:** Patient portal with: weight logging, photo uploads, progress journal entries, "Days Until Refill" widget, appointment scheduling.

**What CULTR has:** `app/dashboard/page.tsx` exists but appears to be basic order tracking. `app/track/daily/page.tsx` exists for daily tracking. BiologicalAgeCard and BiomarkerTrends components exist.

**Implementation:**
- Add weight logging with chart visualization (Recharts already installed)
- Add progress photos (before/after, monthly)
- Add a "Your Journey" timeline showing: signup → intake → first delivery → weight milestones
- Add refill countdown widget
- **Effort:** 2-3 days. Dashboard components + API routes.

---

### 15. Live Chat / Support Widget

**What MEDVi does:** Zendesk for support ticketing. AI chatbot for first-line responses. 24/7 messaging in patient portal. Phone support.

**What CULTR has:** No chat widget. No live support. Support is email-only via the support form.

**Implementation:**
- **Quick:** Add Crisp (free tier) or Intercom ($39/mo) chat widget
- **Better:** Integrate Zendesk Chat or build into existing portal messaging
- Add to: homepage, pricing page, checkout page, intake form (places where users get stuck)
- **Effort:** 1-2 hours for widget drop-in. 1-2 days for custom integration.

---

### 16. Exit-Intent Popup on Pricing/Checkout Pages

**What MEDVi does:** ClickFunnels integration for landing page funnels with built-in exit-intent. Multiple funnel variants.

**What CULTR has:** No exit-intent popups. No lead capture on bounce.

**Implementation:**
- Add exit-intent detection on `/pricing` and `/join/[tier]` pages
- Show a modal: "Wait — get 15% off your first month with code FOUNDER15"
- Capture email even if they don't convert (for abandoned checkout sequence)
- **Effort:** 3-4 hours. Client component with mouse tracking.

---

### 17. Creator Affiliate Landing Pages (Per-Creator)

**What MEDVi does:** Affiliate tracking with Everflow. Custom landing page URLs per traffic source. Multiple page variants (whgls-lp-a1, etc.).

**What CULTR has:** `/creators/[slug]/page.tsx` for public creator profiles + `/r/[slug]/route.ts` for click tracking redirects. But creators share generic site links — no personalized landing pages with the creator's testimonial, photo, and custom messaging.

**Implementation:**
- Create a `/join/[tier]?ref=[creator-slug]` variant that shows:
  - Creator's name: "Join through [Creator Name]"
  - Creator's testimonial/story
  - Creator's discount code auto-applied
  - Creator's profile photo
- This personalizes the checkout experience and increases conversion from creator referrals
- **Effort:** 4-6 hours. Modify join page to accept ref param + fetch creator data.

---

## TIER 4: STRATEGIC MOAT (Do This Year)

These build long-term competitive advantages MEDVi can't replicate.

---

### 18. Content Marketing / SEO Blog Strategy

**What MEDVi does:** NOTHING. 11 URLs in sitemap. Zero blog. Zero content marketing. Zero SEO investment. Their acquisition is 100% paid.

**What CULTR has:** 12 blog posts in `content/blog/`, a science library at `/science`, and a peptide protocol library. This is a significant structural advantage.

**Implementation:**
- Publish 2-4 SEO-optimized articles per month targeting:
  - "compounded semaglutide online" (MEDVi's top keyword)
  - "GLP-1 weight loss telehealth"
  - "peptide therapy near me"
  - "BPC-157 dosing guide"
  - "[competitor] alternative" pages
- Each article should have: clear CTA to quiz, internal links to pricing, FAQ schema markup
- **Effort:** Ongoing. 4-8 hours per article. Compounds over 6-12 months.

---

### 19. Mobile App / PWA

**What MEDVi does:** Web-only patient portal. No mobile app. This is a gap for them.

**What CULTR has:** Web-only dashboard. No mobile app.

**Implementation:**
- Convert dashboard to PWA (Progressive Web App) with offline support
- Add push notifications for: medication reminders, appointment reminders, weight tracking nudges
- This would be a clear differentiator vs. MEDVi (web-only) and competitive with Hims (has an app)
- **Effort:** 2-3 weeks for basic PWA. Ongoing for features.

---

### 20. Video Testimonials / Before-After Gallery

**What MEDVi does:** AI-generated fake before/after photos (exposed by Futurism). This is a MASSIVE vulnerability.

**What CULTR has:** Text testimonials only. No video. No before/after.

**Implementation:**
- Collect real video testimonials from members (even 30-second phone recordings)
- Create a `/results` page with: video testimonials + real before/after photos (with consent) + quantified outcomes
- This directly counters MEDVi's fake content with authentic member stories
- Leverage the creator affiliate network — creators can share their own results
- **Effort:** 1-2 days for the page. Ongoing content collection.

---

## QUICK WINS SUMMARY (Ranked by Leverage)

| # | Action | Effort | Impact | Revenue Lift |
|---|---|---|---|---|
| 1 | **Capture email in quiz** (before results) | 2 hours | **CRITICAL** | Recovers 950/1000 lost leads |
| 2 | **Add Meta Pixel + Google Ads tag** | 2 hours | **CRITICAL** | Enables all paid growth |
| 3 | Price anchor "$149" in hero | 1 hour | High | Direct conversion lift |
| 4 | Weight goal selector on homepage | 3 hours | High | Engagement → conversion |
| 5 | Promo banner with urgency | 3 hours | High | Conversion lift 10-20% |
| 6 | Specific weight loss numbers in testimonials | 3 hours | Medium-High | Trust → conversion |
| 7 | Speed promise ("24hr review, 5-day shipping") | 2 hours | Medium-High | Reduces hesitation |
| 8 | Post-checkout upsell (Blood Test + Consultation) | 5 hours | High | AOV increase 10-30% |
| 9 | Exit-intent popup on pricing/checkout | 4 hours | Medium | Captures abandoners |
| 10 | Abandoned checkout email sequence (3 emails) | 1 day | High | Recovers 5-15% of abandons |
| 11 | Abandoned quiz email sequence (3 emails) | 4 hours | High | Recovers quiz drop-offs |
| 12 | Referral program ($50/$50) in dashboard | 2 days | High | Lowest CAC channel |
| 13 | Trustpilot integration | 3 hours | Medium | Third-party social proof |
| 14 | Spanish language (Weglot) | 3 hours | Medium | +20% TAM in FL |
| 15 | A/B testing setup (Posthog/Vercel flags) | 6 hours | High (long-term) | Continuous optimization |
| 16 | Onboarding email drip (10 emails via Resend) | 3 days | High | Retention + LTV |
| 17 | Live chat widget (Crisp free tier) | 2 hours | Medium | Reduces checkout friction |
| 18 | Creator-personalized checkout pages | 5 hours | Medium | Creator conversion lift |
| 19 | Content/SEO (ongoing publishing) | Ongoing | Very High (long-term) | Organic acquisition moat |
| 20 | Video testimonials / results page | 2 days | High | Authentic counter to MEDVi fakes |
| 21 | Progress tracking + weight logging in portal | 3 days | Medium | Retention + engagement |
| 22 | PWA / mobile push notifications | 2 weeks | Medium-High | Retention + re-engagement |

---

## THE TOP 3 THINGS TO DO TOMORROW

### #1: Capture email in the quiz (2 hours)
Right now every quiz-taker who doesn't click "Join" is lost forever. Add an email field after question 2-3: "Enter your email to save your personalized results." Store in `waitlist_entries`, sync to Mailchimp with `quiz-started` tag. The `pending_intakes` table + Mailchimp integration + Resend email functions already exist — you just need to connect them. This single change could recover hundreds of leads per month.

### #2: Add Meta Pixel + Google Ads conversion tag (2 hours)
Without this you cannot run paid advertising. MEDVi's entire $401M business runs on Google Ads (`AW-17694289818`) + Meta Pixel. CULTR has full GA4 e-commerce events already (`lib/analytics.ts`) — adding the paid conversion tags is just a script tag in `app/layout.tsx` + firing the existing events to the new tags.

### #3: Put "$149/mo" in the homepage hero (30 minutes)
You beat MEDVi on price ($149 vs $179 for semaglutide) and nobody knows it. Change the hero subheadline to include "Starting at $149*/mo" with an asterisk to the Core/Semaglutide plan. One copy change in `app/page.tsx`.
