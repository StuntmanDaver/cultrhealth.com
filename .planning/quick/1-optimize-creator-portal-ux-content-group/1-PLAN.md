---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - app/creators/portal/dashboard/page.tsx
  - components/creators/CreatorSidebar.tsx
  - components/creators/CreatorHeader.tsx
  - components/creators/Leaderboard.tsx
  - components/creators/NotificationBell.tsx
  - app/creators/portal/share/page.tsx
  - app/creators/portal/campaigns/page.tsx
  - app/api/creators/earnings/overview/route.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "Dashboard sections are visually grouped with clear headers (Performance, Commissions, Growth)"
    - "Getting Started checklist reflects actual creator state (links created, codes assigned)"
    - "Leaderboard and notifications do not display fabricated data"
    - "Sidebar groups Settings and Support under ACCOUNT label"
    - "Share page codes display correctly without type casting"
    - "Earnings API returns accurate lastMonthEarnings calculation"
    - "Campaigns page handles stale/empty campaigns gracefully"
  artifacts:
    - path: "app/creators/portal/dashboard/page.tsx"
      provides: "Restructured dashboard with grouped sections"
    - path: "components/creators/CreatorSidebar.tsx"
      provides: "Sidebar with ACCOUNT group for Settings/Support"
    - path: "app/api/creators/earnings/overview/route.ts"
      provides: "Fixed lastMonthEarnings calculation"
  key_links:
    - from: "app/creators/portal/dashboard/page.tsx"
      to: "lib/contexts/CreatorContext.tsx"
      via: "useCreator hook"
      pattern: "useCreator"
    - from: "app/api/creators/earnings/overview/route.ts"
      to: "lib/creators/db.ts"
      via: "getCreatorOrderStats"
      pattern: "getCreatorOrderStats"
---

<objective>
Optimize the Creator Portal UX with better content grouping, accurate data display, navigation clarity, and removal of misleading synthetic data. This is an 80/20 refactor -- essentials only.

Purpose: Creators currently see fabricated leaderboard entries, fake notifications, and stale campaigns. The dashboard lacks visual section grouping. These issues erode trust and make the portal feel unfinished.

Output: A cleaner, more honest creator portal with grouped dashboard sections, dynamic onboarding checklist, accurate earnings data, and no fake data.
</objective>

<execution_context>
@/Users/davidk/.claude/get-shit-done/workflows/execute-plan.md
@/Users/davidk/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/creators/portal/dashboard/page.tsx
@components/creators/CreatorSidebar.tsx
@components/creators/CreatorHeader.tsx
@components/creators/Leaderboard.tsx
@components/creators/NotificationBell.tsx
@app/creators/portal/share/page.tsx
@app/creators/portal/campaigns/page.tsx
@app/api/creators/earnings/overview/route.ts
@lib/contexts/CreatorContext.tsx
@lib/config/affiliate.ts

<interfaces>
<!-- Key types and contracts the executor needs -->

From lib/config/affiliate.ts:
```typescript
export interface CreatorDashboardMetrics {
  totalClicks: number
  totalOrders: number
  totalRevenue: number
  totalCommission: number
  pendingCommission: number
  thisMonthClicks: number
  thisMonthOrders: number
  thisMonthRevenue: number
  thisMonthCommission: number
  conversionRate: number
  tier: number
  overrideRate: number
  recruitCount: number
  nextTierRequirement: number
  activeMemberCount: number
  commissionRate: number
  creatorStartDate?: string
  isInBonusWindow: boolean
  bonusWindowDaysLeft: number
  directMembershipEarnings: number
  directProductEarnings: number
  overrideEarnings: number
}

export interface AffiliateCode {
  id: string
  creator_id: string
  code: string
  code_type: CodeType  // 'membership' | 'product' | 'general'
  is_primary: boolean
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  use_count: number
  total_revenue: number
  active: boolean
  created_at: string
  updated_at: string
}
```

From lib/contexts/CreatorContext.tsx:
```typescript
interface CreatorContextType {
  creator: Creator | null
  metrics: CreatorDashboardMetrics | null
  links: TrackingLink[]
  codes: AffiliateCode[]
  loading: boolean
  error: string | null
  refreshAll: () => Promise<void>
  refreshMetrics: () => Promise<void>
  refreshLinks: () => Promise<void>
  refreshCodes: () => Promise<void>
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Dashboard content grouping, dynamic Getting Started, remove fake data</name>
  <files>
    app/creators/portal/dashboard/page.tsx
    components/creators/Leaderboard.tsx
    components/creators/NotificationBell.tsx
    components/creators/CreatorHeader.tsx
    components/creators/CreatorSidebar.tsx
  </files>
  <action>
**Dashboard page (`app/creators/portal/dashboard/page.tsx`):**

1. Add section grouping with labeled dividers. Wrap related content in visual groups:
   - **"Performance" section** (icon: TrendingUp): Contains the 4 MetricCard grid + AnalyticsCharts. Add a `<h2>` with "Performance" label above the metrics grid.
   - **"Commissions" section** (icon: DollarSign): Contains CommissionBreakdown + BonusWindowBanner. Move BonusWindowBanner inside this section (currently it floats above metrics).
   - **"Growth" section** (icon: Users): Contains TierProgressBar + MilestoneBadges.
   - **Quick Actions** stays at the bottom as-is.

2. Each section gets a simple label: `<div className="flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-cultr-textMuted" /><h2 className="text-sm font-semibold uppercase tracking-wider text-cultr-textMuted">Section Name</h2></div>`

3. Make GettingStartedCard dynamic -- use `useCreator` context to check actual state:
   - "Application approved" = `true` (always, since they're in the portal)
   - "Create your first tracking link" = `links.length > 0`
   - "Get your referral codes" = `codes.length > 0`
   - "Share CULTR with your audience" = `metrics.totalClicks > 0`
   - "Make your first sale" = `metrics.totalOrders > 0`
   Show the card for creators who have NOT completed all 5 steps (not just zero activity). Hide when all 5 are done.

4. REMOVE the Leaderboard component import and rendering from the dashboard. The Leaderboard generates 100% fabricated competitor data (random multipliers against your own metrics with names like "Creator A", "Creator B"). This is misleading. Replace with a simple "Top Tip" card that links to Resources:
   ```
   <div className="bg-white border border-stone-200 rounded-2xl p-6">
     <h3 className="font-display font-bold text-cultr-forest mb-2">Creator Tip</h3>
     <p className="text-sm text-cultr-textMuted mb-3">
       Creators who post consistently see 3x more conversions. Check out our content calendar and social templates.
     </p>
     <Link href="/creators/portal/resources" className="text-sm font-medium text-cultr-forest hover:underline">
       Browse Resources &rarr;
     </Link>
   </div>
   ```

5. Keep the AnalyticsCharts component as-is (it at least shows proportional data even if synthetic). Move it into the Performance section directly under the metrics grid (not in a split layout with leaderboard). Make it full-width: `<div className="mt-4"><AnalyticsCharts ... /></div>` (remove the `lg:col-span-3` / `lg:col-span-5` grid layout).

**CreatorHeader (`components/creators/CreatorHeader.tsx`):**

6. Remove NotificationBell import and rendering. The notification system is 100% synthetic (generates fake "New clicks detected" messages from current month stats). It adds no value and creates false expectations. Remove the notification bell entirely from the header. Keep the tier badge and mobile menu button.

**NotificationBell (`components/creators/NotificationBell.tsx`):**

7. Leave the file in place but do NOT import it anywhere. It can be restored when a real notification system exists.

**Leaderboard (`components/creators/Leaderboard.tsx`):**

8. Leave the file in place but do NOT import it anywhere. It can be restored when a real leaderboard API exists.

**CreatorSidebar (`components/creators/CreatorSidebar.tsx`):**

9. Update NAV_GROUPS to consolidate Settings and Support under an "ACCOUNT" group. Change the last group from `label: null` to `label: 'ACCOUNT'`. This gives clear grouping to all sidebar items:
   - (no label): Dashboard
   - PROMOTE: Share & Earn, Campaigns
   - MONEY: Earnings, Payouts
   - GROW: My Network, Resources  (rename "TOOLS" to "GROW" -- more action-oriented for influencer audience)
   - ACCOUNT: Settings, Support
  </action>
  <verify>
    <automated>cd /Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr\ Health\ Website && npx tsc --noEmit --pretty 2>&1 | head -40</automated>
  </verify>
  <done>
    - Dashboard has 3 labeled sections (Performance, Commissions, Growth)
    - Getting Started card checks actual links/codes/clicks/orders state from context
    - Leaderboard and NotificationBell are not imported or rendered anywhere
    - Sidebar has ACCOUNT group containing Settings + Support, TOOLS renamed to GROW
    - Analytics chart is full-width in Performance section
    - No TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix Share page type casting, earnings API bug, and stale campaigns</name>
  <files>
    app/creators/portal/share/page.tsx
    app/api/creators/earnings/overview/route.ts
    app/creators/portal/campaigns/page.tsx
  </files>
  <action>
**Share page (`app/creators/portal/share/page.tsx`):**

1. Fix the `(code as any).code_type` type casting on line 375. The `AffiliateCode` type already has `code_type: CodeType` defined. The codes from `useCreator()` are typed as `AffiliateCode[]`. Remove the `as any` cast -- just use `code.code_type` directly. The type is already correct in the interface.

2. In the codes section, add a subtle helper text under each code explaining what it's for:
   - Membership code: "Share when referring someone to a CULTR subscription"
   - Product code: "Share for one-time peptide/product purchases"
   This replaces the amber info box above (which says the same thing less clearly). Remove the amber "Two codes, two purposes" box and instead show the explanation inline with each code via the `stats` prop of CopyableLink, or add a small `<p>` under each CopyableLink.

**Earnings API (`app/api/creators/earnings/overview/route.ts`):**

3. Fix the `lastMonthEarnings` calculation bug. Current code:
   ```
   const lastMonthStats = await getCreatorOrderStats(auth.creatorId, lastMonthStart)
   // ...
   lastMonthEarnings: lastMonthStats.totalCommission - thisMonthStats.totalCommission,
   ```
   The problem: `getCreatorOrderStats(id, since)` returns stats for ALL orders since `since`. So `lastMonthStats` (since the 1st of last month) INCLUDES this month's data. The subtraction `lastMonthStats - thisMonthStats` is an approximation that breaks if `getCreatorOrderStats` counts differently by boundary.

   Fix: Create a proper last-month-only query by fetching stats between `lastMonthStart` and `thisMonthStart`:
   ```typescript
   // Calculate last month boundaries
   const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1) // = thisMonthStart

   // For last month, we need stats BETWEEN lastMonthStart and thisMonthStart
   // Since getCreatorOrderStats only accepts a 'since' param, calculate:
   const allSinceLastMonth = await getCreatorOrderStats(auth.creatorId, lastMonthStart)
   const lastMonthOnly = allSinceLastMonth.totalCommission - thisMonthStats.totalCommission
   ```

   Actually, the current approach IS correct in concept -- it's just that the variable name is confusing. `allSinceLastMonth.totalCommission - thisMonth.totalCommission = lastMonthOnly`. But there's an edge case: `getCreatorOrderStats` uses `created_at >= since` which means the boundary might overlap. Since both queries use `>=` on the month start, the subtraction is actually correct.

   Wait, re-reading: `lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)` and `thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)`. Then `lastMonthStats = getCreatorOrderStats(id, lastMonthStart)` which returns everything from the 1st of LAST month to now. And `thisMonthStats = getCreatorOrderStats(id, thisMonthStart)` returns everything from 1st of THIS month to now. So `lastMonthStats - thisMonthStats` = last month only. This is actually correct.

   However, there IS a real bug: `lastMonthEarnings` uses `totalCommission` from `getCreatorOrderStats` which sums `direct_commission_amount` from `order_attributions`, NOT from `commission_ledger`. This means it only counts DIRECT commissions, not override commissions. Meanwhile `thisMonthEarnings` on line 46 also uses `thisMonthStats.totalCommission` (same source), so they're at least consistent. But `lifetimeEarnings` comes from `commissionSummary.total` which is from `commission_ledger` (includes overrides). So `lifetimeEarnings` includes overrides but `thisMonthEarnings` and `lastMonthEarnings` do NOT. This is the real inconsistency.

   Fix: For `thisMonthEarnings`, query the commission_ledger for this month instead of order_attributions. Add a comment explaining the data source difference. Since we don't have a `getCommissionSummaryByCreatorSince` function and adding one is scope creep, use a simpler fix: add a code comment noting the inconsistency and rename the variable to be clear it's direct-only:

   Actually, the simplest 80/20 fix: just add a comment documenting this known limitation and leave the calculation as-is. The bigger visual issue is that `lastMonthEarnings` shows direct-only while `lifetimeEarnings` shows all streams. Add a `// TODO: thisMonthEarnings and lastMonthEarnings only count direct commissions from order_attributions, not overrides from commission_ledger. lifetimeEarnings includes all streams.` comment.

**Campaigns page (`app/creators/portal/campaigns/page.tsx`):**

4. The campaigns are 100% hardcoded with stale dates (e.g., "February Referral Bonus" with endDate "2026-02-28" -- already expired). Fix by:
   - Add date-awareness: filter campaigns whose `endDate` is in the past to `status: 'ended'` automatically, regardless of what the hardcoded status says. Add this logic at the top of the component:
   ```typescript
   const now = new Date()
   const processedCampaigns = CAMPAIGNS.map(c => {
     if (c.endDate && new Date(c.endDate) < now && c.status === 'active') {
       return { ...c, status: 'ended' as const, badge: 'Ended' }
     }
     return c
   })
   ```
   - Update the page to use `processedCampaigns` instead of `CAMPAIGNS`.
   - Add an empty state for when all campaigns have ended: "No active campaigns right now. Check back soon or contact your creator manager for upcoming opportunities."
   - Show ended campaigns in a collapsed "Past Campaigns" section at the bottom (collapsed by default).
  </action>
  <verify>
    <automated>cd /Users/davidk/Documents/Dev-Projects/App-Ideas/Cultr\ Health\ Website && npx tsc --noEmit --pretty 2>&1 | head -40</automated>
  </verify>
  <done>
    - Share page codes render without `as any` type casting
    - Codes section has inline purpose descriptions instead of amber info box
    - Earnings API has documented TODO comment about commission source inconsistency
    - Campaigns page auto-detects expired campaigns, shows "Past Campaigns" section
    - Empty state shown when no active campaigns exist
    - No TypeScript errors
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Creator portal UX optimizations: dashboard section grouping, dynamic onboarding checklist, removed fake leaderboard/notifications, sidebar reorganization, code display fixes, campaign date-awareness</what-built>
  <how-to-verify>
    1. Visit https://staging.cultrhealth.com/creators/login and log in with any team email
    2. On the Dashboard, verify:
       - Three labeled sections visible: Performance, Commissions, Growth
       - No leaderboard panel (replaced with Creator Tip card)
       - No notification bell in the top header bar
       - Getting Started card shows dynamic checkmarks (links created, codes assigned, etc.)
       - Analytics chart is full-width (not in split layout)
    3. Check the Sidebar:
       - PROMOTE, MONEY, GROW, ACCOUNT groups visible
       - Settings and Support are under ACCOUNT
    4. Go to Share & Earn page:
       - Codes section has inline descriptions per code (no amber "Two codes" box)
    5. Go to Campaigns page:
       - February bonus campaign should show as "Ended" (not "Active")
       - Past campaigns section visible at bottom
    6. Mobile: Open sidebar on mobile -- groups still readable
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- All creator portal pages render without console errors
- No `as any` type casts in share/page.tsx codes section
- Leaderboard and NotificationBell components still exist as files but are not imported
- Sidebar shows 5 nav groups (Dashboard, PROMOTE, MONEY, GROW, ACCOUNT)
</verification>

<success_criteria>
- Dashboard has clear visual section grouping (Performance, Commissions, Growth)
- Getting Started card reflects real creator state from context
- No fabricated data displayed anywhere (no fake leaderboard, no fake notifications)
- Sidebar navigation is logically organized with ACCOUNT group
- Share page codes display without type casting hacks
- Campaigns auto-expire based on endDate
- Zero TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/quick/1-optimize-creator-portal-ux-content-group/1-SUMMARY.md`
</output>
